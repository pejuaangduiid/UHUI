package bursa

import (
	"context"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/payment"
)

type CampaignCloser struct {
	pool    *pgxpool.Pool
	q       *gen.Queries
	payment payment.PaymentProvider
}

func NewCampaignCloser(pool *pgxpool.Pool, q *gen.Queries, p payment.PaymentProvider) *CampaignCloser {
	return &CampaignCloser{pool: pool, q: q, payment: p}
}

func (c *CampaignCloser) CloseExpiredCampaigns(ctx context.Context) (int, error) {
	expired, err := c.q.ListExpiredOpenCampaigns(ctx)
	if err != nil {
		return 0, err
	}

	closedCount := 0
	for _, camp := range expired {
		if err := c.closeSingleCampaign(ctx, camp); err != nil {
			slog.Error("failed to close expired campaign", "campaign_id", uuid.UUID(camp.ID.Bytes).String(), "error", err)
			continue
		}
		closedCount++
	}
	return closedCount, nil
}

func (c *CampaignCloser) closeSingleCampaign(ctx context.Context, camp gen.BursaCampaign) error {
	tx, err := c.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := c.q.WithTx(tx)

	investments, err := qtx.ListConfirmedInvestmentsByCampaign(ctx, camp.ID)
	if err != nil {
		return err
	}

	for _, inv := range investments {
		if inv.PaymentRef.Valid {
			_ = c.payment.Refund(ctx, inv.PaymentRef.String, inv.AmountIdr)
		}
	}

	if refErr := qtx.RefundCampaignInvestments(ctx, camp.ID); refErr != nil {
		return refErr
	}

	_, err = qtx.UpdateCampaignStatus(ctx, gen.UpdateCampaignStatusParams{
		ID:     camp.ID,
		Status: gen.CampaignStatusClosed,
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
