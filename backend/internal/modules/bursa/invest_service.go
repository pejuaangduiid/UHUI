package bursa

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/payment"
)

type InvestService struct {
	pool    *pgxpool.Pool
	q       *gen.Queries
	payment payment.PaymentProvider
}

func NewInvestService(pool *pgxpool.Pool, q *gen.Queries, p payment.PaymentProvider) *InvestService {
	return &InvestService{pool: pool, q: q, payment: p}
}

type InvestParam struct {
	IdempotencyKey string
	RequestHash    []byte
	AmountIDR      int64
	InvestorID     uuid.UUID
	CampaignID     uuid.UUID
}

func (s *InvestService) Invest(ctx context.Context, p InvestParam) (*InvestmentDTO, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memulai transaksi: " + err.Error())
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.q.WithTx(tx)

	existing, err := s.checkExistingInvestment(ctx, qtx, p)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}

	camp, err := s.validateCampaignForInvest(ctx, qtx, p.CampaignID, p.InvestorID, p.AmountIDR)
	if err != nil {
		return nil, err
	}

	charge, err := s.payment.Charge(ctx, payment.ChargeRequest{
		InvestorID:     p.InvestorID.String(),
		CampaignID:     p.CampaignID.String(),
		IdempotencyKey: p.IdempotencyKey,
		AmountIDR:      p.AmountIDR,
	})
	if err != nil {
		return nil, apperr.BadRequest("PAYMENT_FAILED", "Pembayaran gagal diproses", err.Error())
	}

	inv, err := s.persistInvestment(ctx, qtx, p, charge.PaymentRef, camp.ID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Internal("Gagal menyimpan transaksi investasi: " + err.Error())
	}
	return toInvestmentDTO(inv), nil
}

func (s *InvestService) checkExistingInvestment(ctx context.Context, qtx *gen.Queries, p InvestParam) (*InvestmentDTO, error) {
	existing, err := qtx.FindInvestmentByIdempotencyKey(ctx, gen.FindInvestmentByIdempotencyKeyParams{
		InvestorID:     pgtype.UUID{Bytes: p.InvestorID, Valid: true},
		IdempotencyKey: p.IdempotencyKey,
	})
	if err == nil {
		if !bytes.Equal(existing.RequestHash, p.RequestHash) {
			return nil, apperr.Conflict("IDEMPOTENCY_CONFLICT", "Idempotency key digunakan dengan payload berbeda", "")
		}
		return toInvestmentDTO(existing), nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, apperr.Internal("Gagal memeriksa idempotency key: " + err.Error())
	}
	return nil, nil
}

func (s *InvestService) validateCampaignForInvest(ctx context.Context, qtx *gen.Queries, campID, investorID uuid.UUID, amountIDR int64) (*gen.BursaCampaign, error) {
	camp, err := qtx.GetCampaignByIDForUpdate(ctx, pgtype.UUID{Bytes: campID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("CAMPAIGN_NOT_FOUND", "Kampanye tidak ditemukan", "")
	}
	if camp.Status != gen.CampaignStatusOpen {
		return nil, apperr.BadRequest("CAMPAIGN_NOT_OPEN", "Kampanye tidak sedang menerima pendanaan", "")
	}
	if camp.ClosesAt.Valid && time.Now().After(camp.ClosesAt.Time) {
		return nil, apperr.BadRequest("CAMPAIGN_EXPIRED", "Masa penawaran kampanye telah berakhir", "")
	}

	sme, err := qtx.GetSMEByID(ctx, camp.SmeID)
	if err != nil {
		return nil, apperr.Internal("Gagal mengambil data UMKM: " + err.Error())
	}
	if err := checkCampaignAndSMESuspension(&camp, &sme); err != nil {
		return nil, err
	}
	if sme.OwnerID.Bytes == investorID {
		return nil, apperr.Forbidden("OWNER_CANNOT_INVEST", "Pemilik UMKM tidak dapat berinvestasi pada kampanye sendiri", "")
	}

	remaining := camp.TargetAmountIdr - camp.RaisedAmountIdr
	if err := validateAmount(amountIDR, remaining, camp.MinInvestmentIdr); err != nil {
		return nil, err
	}
	return &camp, nil
}

func checkCampaignAndSMESuspension(camp *gen.BursaCampaign, sme *gen.Sme) error {
	if camp.IsSuspended {
		reason := "Kampanye ini sedang ditangguhkan oleh pengawas bursa"
		if camp.SuspensionReason.Valid && camp.SuspensionReason.String != "" {
			reason = camp.SuspensionReason.String
		}
		return apperr.BadRequest("CAMPAIGN_SUSPENDED", fmt.Sprintf("Kampanye ditangguhkan: %s", reason), "")
	}
	if sme.IsSuspended {
		reason := "Bisnis penerbit sedang ditangguhkan oleh pengawas"
		if sme.SuspensionReason.Valid && sme.SuspensionReason.String != "" {
			reason = sme.SuspensionReason.String
		}
		return apperr.BadRequest("SME_SUSPENDED", fmt.Sprintf("Penerbit ditangguhkan: %s", reason), "")
	}
	return nil
}

func validateAmount(amount, remaining, minInvest int64) error {
	if amount > remaining {
		return apperr.BadRequest("TARGET_EXCEEDED", "Nominal investasi melebihi sisa target pendanaan kampanye", fmt.Sprintf("Maksimal alokasi tersedia: Rp %d", remaining))
	}
	if remaining < minInvest {
		if amount != remaining {
			return apperr.BadRequest("REMAINDER_MISMATCH", "Nominal harus tepat sebesar sisa kuota untuk menutup kampanye", fmt.Sprintf("Sisa kuota penutupan: Rp %d", remaining))
		}
		return nil
	}
	if amount < minInvest {
		return apperr.BadRequest("BELOW_MIN_INVESTMENT", "Nominal investasi di bawah batas minimal", fmt.Sprintf("Minimal investasi: Rp %d", minInvest))
	}
	return nil
}

func (s *InvestService) persistInvestment(ctx context.Context, qtx *gen.Queries, p InvestParam, paymentRef string, campID pgtype.UUID) (gen.Investment, error) {
	inv, err := qtx.CreateInvestment(ctx, gen.CreateInvestmentParams{
		CampaignID:     pgtype.UUID{Bytes: p.CampaignID, Valid: true},
		InvestorID:     pgtype.UUID{Bytes: p.InvestorID, Valid: true},
		AmountIdr:      p.AmountIDR,
		Status:         gen.InvestmentStatusConfirmed,
		IdempotencyKey: p.IdempotencyKey,
		RequestHash:    p.RequestHash,
		PaymentRef:     pgtype.Text{String: paymentRef, Valid: paymentRef != ""},
	})
	if err != nil {
		return gen.Investment{}, apperr.Internal("Gagal mencatat investasi: " + err.Error())
	}

	_, err = qtx.AddCampaignRaisedAmount(ctx, gen.AddCampaignRaisedAmountParams{
		ID:              campID,
		RaisedAmountIdr: p.AmountIDR,
	})
	if err != nil {
		return gen.Investment{}, apperr.Internal("Gagal memperbarui total perolehan kampanye: " + err.Error())
	}
	return inv, nil
}

func (s *InvestService) ListInvestorPortfolio(ctx context.Context, investorID uuid.UUID) ([]PortfolioItemDTO, error) {
	rows, err := s.q.ListInvestorPortfolio(ctx, pgtype.UUID{Bytes: investorID, Valid: true})
	if err != nil {
		return nil, apperr.Internal("Gagal mengambil portofolio: " + err.Error())
	}
	items := make([]PortfolioItemDTO, len(rows))
	for i, r := range rows {
		items[i] = PortfolioItemDTO{
			ID:             uuid.UUID(r.ID.Bytes).String(),
			CampaignID:     uuid.UUID(r.CampaignID.Bytes).String(),
			CampaignTitle:  r.CampaignTitle,
			CampaignSlug:   r.CampaignSlug,
			CampaignStatus: string(r.CampaignStatus),
			Scheme:         string(r.Scheme),
			ReturnShareBps: r.ReturnShareBps,
			TermMonths:     r.TermMonths,
			SMEID:          uuid.UUID(r.SmeID.Bytes).String(),
			BusinessName:   r.BusinessName,
			Sector:         r.Sector,
			AmountIDR:      r.AmountIdr,
			Status:         string(r.Status),
			CreatedAt:      r.CreatedAt.Time,
		}
		if r.PaymentRef.Valid {
			items[i].PaymentRef = r.PaymentRef.String
		}
	}
	return items, nil
}

func toInvestmentDTO(i gen.Investment) *InvestmentDTO {
	dto := &InvestmentDTO{
		ID:             uuid.UUID(i.ID.Bytes).String(),
		CampaignID:     uuid.UUID(i.CampaignID.Bytes).String(),
		InvestorID:     uuid.UUID(i.InvestorID.Bytes).String(),
		AmountIDR:      i.AmountIdr,
		Status:         string(i.Status),
		IdempotencyKey: i.IdempotencyKey,
		RequestHash:    string(i.RequestHash),
		CreatedAt:      i.CreatedAt.Time,
	}
	if i.PaymentRef.Valid {
		dto.PaymentRef = i.PaymentRef.String
	}
	return dto
}
