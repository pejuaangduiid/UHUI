package bursa

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/payment"
)

func TestExecuteShareLiquidation(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	payProvider := payment.NewSimulatedProvider(pool)

	var ownerIDStr, investorIDStr, smeIDStr string
	err := pool.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
		VALUES ('owner-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Owner Test', 'sme_owner', NOW())
		RETURNING id::text
	`).Scan(&ownerIDStr)
	if err != nil {
		t.Fatalf("create owner: %v", err)
	}
	ownerID := uuid.MustParse(ownerIDStr)

	err = pool.QueryRow(ctx, `
		INSERT INTO smes (owner_id, business_name, slug, sector, is_incorporated_pt, ai_interval)
		VALUES ($1, 'PT Kopi Test', 'kopi-' || gen_random_uuid(), 'Kuliner', true, 'disabled')
		RETURNING id::text
	`, ownerID).Scan(&smeIDStr)
	if err != nil {
		t.Fatalf("create sme: %v", err)
	}
	smeID := uuid.MustParse(smeIDStr)

	campID := uuid.New()
	slug := "test-camp-" + campID.String()[:8]
	_, err = pool.Exec(ctx, `
		INSERT INTO bursa_campaigns (id, sme_id, title, slug, scheme, target_amount_idr, raised_amount_idr, min_investment_idr, return_share_bps, term_months, status, closes_at)
		VALUES ($1, $2, 'Campaign Test', $3, 'revenue_sharing', 50000000, 0, 500000, 1500, 12, 'open', $4)
	`, campID, smeID, slug, time.Now().Add(24*time.Hour))
	if err != nil {
		t.Fatalf("create campaign: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
		VALUES ('inv-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Inv Test', 'investor', NOW())
		RETURNING id::text
	`).Scan(&investorIDStr)
	if err != nil {
		t.Fatalf("create investor: %v", err)
	}
	investorID := uuid.MustParse(investorIDStr)

	investSvc := NewInvestService(pool, q, payProvider)
	inv, err := investSvc.Invest(ctx, InvestParam{
		CampaignID:     campID,
		InvestorID:     investorID,
		AmountIDR:      10_000_000,
		IdempotencyKey: uuid.New().String(),
		RequestHash:    []byte("hash-test"),
	})
	if err != nil {
		t.Fatalf("invest failed: %v", err)
	}
	if inv.Status != "confirmed" {
		t.Fatalf("expected confirmed, got %s", inv.Status)
	}

	err = executeShareLiquidation(ctx, pool, campID, investorID, 10_000_000)
	if err != nil {
		t.Fatalf("executeShareLiquidation failed: %v", err)
	}

	portfolio, err := q.ListInvestorPortfolio(ctx, pgtype.UUID{Bytes: investorID, Valid: true})
	if err != nil {
		t.Fatalf("list portfolio failed: %v", err)
	}
	for _, p := range portfolio {
		if p.CampaignSlug == slug && p.Status == gen.InvestmentStatusConfirmed {
			t.Fatalf("expected no confirmed investment, got %s with amount %d", p.Status, p.AmountIdr)
		}
	}

	campRow, err := q.GetCampaignBySlug(ctx, slug)
	if err != nil {
		t.Fatalf("get campaign failed: %v", err)
	}
	if campRow.RaisedAmountIdr != 0 {
		t.Fatalf("expected raised_amount_idr to be 0, got %d", campRow.RaisedAmountIdr)
	}
}
