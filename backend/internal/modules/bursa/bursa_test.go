package bursa_test

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/modules/bursa"
	"github.com/uhui/backend/internal/payment"
)

func TestBursa_CampaignLifecycle(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := bursa.NewCampaignService(pool, q)

	smeID, _ := createTestSME(t, pool)
	createTestReadinessScore(t, pool, smeID, 85, true)

	camp, err := svc.CreateCampaign(ctx, smeID, bursa.CreateCampaignReq{
		Title:            "Ekspansi Kopi Sejahtera",
		Scheme:           "revenue_sharing",
		TargetAmountIDR:  10_000_000,
		MinInvestmentIDR: 200_000,
		ReturnShareBps:   1500,
		TermMonths:       12,
		ClosesAt:         time.Now().Add(7 * 24 * time.Hour),
	})
	if err != nil {
		t.Fatalf("create campaign failed: %v", err)
	}
	if camp.Status != "draft" {
		t.Fatalf("expected draft status, got %s", camp.Status)
	}

	campUUID, _ := uuid.Parse(camp.ID)
	submitted, err := svc.SubmitCampaign(ctx, smeID, campUUID)
	if err != nil {
		t.Fatalf("submit campaign failed: %v", err)
	}
	if submitted.Status != "in_review" {
		t.Fatalf("expected in_review status, got %s", submitted.Status)
	}
}

func TestBursa_Concurrency50Investments(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	payProvider := payment.NewSimulatedProvider()
	investSvc := bursa.NewInvestService(pool, q, payProvider)

	smeID, _ := createTestSME(t, pool)
	createTestReadinessScore(t, pool, smeID, 90, true)
	campID := createOpenCampaign(t, pool, smeID, 10_000_000, 200_000)

	investorIDs := make([]uuid.UUID, 20)
	for j := 0; j < 20; j++ {
		investorIDs[j] = createTestUser(t, pool, "investor")
	}

	var wg sync.WaitGroup
	var successCount int32
	var failedCount int32

	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			investorID := investorIDs[idx%len(investorIDs)]
			key := fmt.Sprintf("idem-%d-%s", idx, uuid.NewString())
			h := sha256.Sum256([]byte(fmt.Sprintf("%d", 500_000)))

			_, err := investSvc.Invest(ctx, bursa.InvestParam{
				InvestorID:     investorID,
				CampaignID:     campID,
				IdempotencyKey: key,
				RequestHash:    h[:],
				AmountIDR:      500_000,
			})
			if err == nil {
				atomic.AddInt32(&successCount, 1)
			} else {
				atomic.AddInt32(&failedCount, 1)
			}
		}(i)
	}

	wg.Wait()

	if successCount != 20 {
		t.Fatalf("expected exactly 20 investments to succeed, got %d (failed: %d)", successCount, failedCount)
	}

	camp, err := q.GetCampaignByID(ctx, pgtype.UUID{Bytes: campID, Valid: true})
	if err != nil {
		t.Fatalf("failed to get campaign: %v", err)
	}
	if camp.RaisedAmountIdr != 10_000_000 {
		t.Fatalf("expected raised amount 10_000_000, got %d", camp.RaisedAmountIdr)
	}
	if camp.Status != gen.CampaignStatusFunded {
		t.Fatalf("expected status funded, got %s", camp.Status)
	}
}

func TestBursa_IdempotencyReplay(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	payProvider := payment.NewSimulatedProvider()
	investSvc := bursa.NewInvestService(pool, q, payProvider)

	smeID, _ := createTestSME(t, pool)
	campID := createOpenCampaign(t, pool, smeID, 5_000_000, 500_000)
	investorID := createTestUser(t, pool, "investor")

	key := "idem-replay-key-1"
	h := sha256.Sum256([]byte("500000"))

	inv1, err := investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     investorID,
		CampaignID:     campID,
		IdempotencyKey: key,
		RequestHash:    h[:],
		AmountIDR:      500_000,
	})
	if err != nil {
		t.Fatalf("first invest failed: %v", err)
	}

	inv2, err := investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     investorID,
		CampaignID:     campID,
		IdempotencyKey: key,
		RequestHash:    h[:],
		AmountIDR:      500_000,
	})
	if err != nil {
		t.Fatalf("second invest failed: %v", err)
	}

	if inv1.ID != inv2.ID {
		t.Fatalf("expected same investment ID for replay, got %s != %s", inv1.ID, inv2.ID)
	}

	camp, _ := q.GetCampaignByID(ctx, pgtype.UUID{Bytes: campID, Valid: true})
	if camp.RaisedAmountIdr != 500_000 {
		t.Fatalf("expected raised amount 500_000 (no double count), got %d", camp.RaisedAmountIdr)
	}
}

func TestBursa_OwnerCannotInvest(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	payProvider := payment.NewSimulatedProvider()
	investSvc := bursa.NewInvestService(pool, q, payProvider)

	smeID, ownerID := createTestSME(t, pool)
	campID := createOpenCampaign(t, pool, smeID, 5_000_000, 500_000)

	key := uuid.NewString()
	h := sha256.Sum256([]byte("500000"))

	_, err := investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     ownerID,
		CampaignID:     campID,
		IdempotencyKey: key,
		RequestHash:    h[:],
		AmountIDR:      500_000,
	})
	if err == nil {
		t.Fatal("expected error when SME owner invests in own campaign, got nil")
	}
}

func TestBursa_RemainderInvestment(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	payProvider := payment.NewSimulatedProvider()
	investSvc := bursa.NewInvestService(pool, q, payProvider)

	smeID, _ := createTestSME(t, pool)

	campID := createOpenCampaign(t, pool, smeID, 1_000_000, 300_000)

	inv1 := createTestUser(t, pool, "investor")
	h1 := sha256.Sum256([]byte("900000"))
	_, err := investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     inv1,
		CampaignID:     campID,
		IdempotencyKey: uuid.NewString(),
		RequestHash:    h1[:],
		AmountIDR:      900_000,
	})
	if err != nil {
		t.Fatalf("first invest failed: %v", err)
	}

	inv2 := createTestUser(t, pool, "investor")
	h2 := sha256.Sum256([]byte("100000"))
	_, err = investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     inv2,
		CampaignID:     campID,
		IdempotencyKey: uuid.NewString(),
		RequestHash:    h2[:],
		AmountIDR:      100_000,
	})
	if err != nil {
		t.Fatalf("remainder invest failed: %v", err)
	}

	camp, _ := q.GetCampaignByID(ctx, pgtype.UUID{Bytes: campID, Valid: true})
	if camp.RaisedAmountIdr != 1_000_000 || camp.Status != gen.CampaignStatusFunded {
		t.Fatalf("expected funded campaign with 1_000_000 raised, got status=%s, raised=%d", camp.Status, camp.RaisedAmountIdr)
	}
}

func TestBursa_ProRataProfitDistribution(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	payProvider := payment.NewSimulatedProvider()
	investSvc := bursa.NewInvestService(pool, q, payProvider)
	distSvc := bursa.NewDistributionService(pool, q)

	smeID, _ := createTestSME(t, pool)
	campID := createOpenCampaign(t, pool, smeID, 10_000_000, 1_000_000)

	invA := createTestUser(t, pool, "investor")
	hA := sha256.Sum256([]byte("6000000"))
	_, _ = investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     invA,
		CampaignID:     campID,
		IdempotencyKey: uuid.NewString(),
		RequestHash:    hA[:],
		AmountIDR:      6_000_000,
	})

	invB := createTestUser(t, pool, "investor")
	hB := sha256.Sum256([]byte("4000000"))
	_, _ = investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     invB,
		CampaignID:     campID,
		IdempotencyKey: uuid.NewString(),
		RequestHash:    hB[:],
		AmountIDR:      4_000_000,
	})

	snapID := createTestSnapshotReport(t, pool, smeID)

	dist, err := distSvc.DistributeProfit(ctx, bursa.DistributeProfitReq{
		CampaignID:       campID,
		ReportSnapshotID: &snapID,
		PeriodStart:      time.Now().Add(-30 * 24 * time.Hour),
		PeriodEnd:        time.Now(),
		PoolIDR:          1_000_000,
	})
	if err != nil {
		t.Fatalf("distribute profit failed: %v", err)
	}

	if len(dist.Items) != 2 {
		t.Fatalf("expected 2 items, got %d", len(dist.Items))
	}

	if dist.Items[0].AmountIDR != 600_000 || dist.Items[1].AmountIDR != 400_000 {
		t.Fatalf("expected 600.000 & 400.000, got %d & %d", dist.Items[0].AmountIDR, dist.Items[1].AmountIDR)
	}
}

func TestBursa_PublicProjectionAllowlist(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)

	smeID, _ := createTestSME(t, pool)
	campID := createOpenCampaign(t, pool, smeID, 5_000_000, 500_000)

	camp, err := q.GetCampaignByID(ctx, pgtype.UUID{Bytes: campID, Valid: true})
	if err != nil {
		t.Fatalf("get campaign failed: %v", err)
	}

	dto := bursa.PublicCampaignDTO{
		Slug:             camp.Slug,
		Title:            camp.Title,
		Scheme:           string(camp.Scheme),
		TargetAmountIDR:  camp.TargetAmountIdr,
		RaisedAmountIDR:  camp.RaisedAmountIdr,
		MinInvestmentIDR: camp.MinInvestmentIdr,
		ReturnShareBps:   camp.ReturnShareBps,
		TermMonths:       camp.TermMonths,
		Status:           string(camp.Status),
		ClosesAt:         camp.ClosesAt.Time,
		BusinessName:     "Test SME",
		Sector:           "Kuliner",
	}

	b, _ := json.Marshal(dto)
	jsonStr := strings.ToLower(string(b))

	forbidden := []string{"owner_id", "email", "password", "profit_margin", "raw_cost"}
	for _, f := range forbidden {
		if strings.Contains(jsonStr, `"`+f+`"`) {
			t.Fatalf("public projection leaked sensitive field: %s", f)
		}
	}
}

func createTestSME(t *testing.T, pool *pgxpool.Pool) (smeID, ownerID uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	ownerID = createTestUser(t, pool, "sme_owner")

	var smeIDStr string
	err := pool.QueryRow(ctx, `
		INSERT INTO smes (owner_id, business_name, slug, sector, is_incorporated_pt, ai_interval, next_ai_analysis_at)
		VALUES ($1, 'Kopi Makmur', 'kopi-' || gen_random_uuid(), 'Kuliner', false, 'disabled', NULL)
		RETURNING id::text
	`, ownerID).Scan(&smeIDStr)
	if err != nil {
		t.Fatalf("failed to insert test SME: %v", err)
	}
	smeID, _ = uuid.Parse(smeIDStr)

	_, _ = pool.Exec(ctx, `
		INSERT INTO sme_documents (sme_id, doc_type, storage_key, status)
		VALUES ($1, 'nib', 'test/nib.pdf', 'verified'), ($1, 'npwp', 'test/npwp.pdf', 'verified')
		ON CONFLICT (sme_id, doc_type) DO NOTHING
	`, smeID)

	return smeID, ownerID
}

func createTestUser(t *testing.T, pool *pgxpool.Pool, role string) uuid.UUID {
	t.Helper()
	ctx := context.Background()
	var userIDStr string
	err := pool.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
		VALUES ('user-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Test User', $1, NOW())
		RETURNING id::text
	`, role).Scan(&userIDStr)
	if err != nil {
		t.Fatalf("failed to insert test user: %v", err)
	}
	id, _ := uuid.Parse(userIDStr)
	return id
}

func createTestReadinessScore(t *testing.T, pool *pgxpool.Pool, smeID uuid.UUID, total int, gatePassed bool) {
	t.Helper()
	ctx := context.Background()
	_, err := pool.Exec(ctx, `
		INSERT INTO readiness_scores (
			sme_id, scheme, scoring_version, period_start, period_end,
			component_a, component_b, component_c, component_d, total,
			gate_passed, gate_failures_json, computed_at
		) VALUES (
			$1, 'revenue_sharing', 1, NOW() - INTERVAL '30 days', NOW(),
			25, 25, 20, 15, $2, $3, '[]', NOW()
		)
	`, smeID, total, gatePassed)
	if err != nil {
		t.Fatalf("failed to insert readiness score: %v", err)
	}
}

func createTestSnapshotReport(t *testing.T, pool *pgxpool.Pool, smeID uuid.UUID) uuid.UUID {
	t.Helper()
	ctx := context.Background()
	var snapIDStr string
	h := sha256.Sum256([]byte("snap-" + uuid.NewString()))
	err := pool.QueryRow(ctx, `
		INSERT INTO report_snapshots (
			sme_id, doc_type, period_start, period_end, payload_json, sha256
		) VALUES (
			$1, 'shareholder_monthly', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{}'::jsonb, $2
		) RETURNING id::text
	`, smeID, h[:]).Scan(&snapIDStr)
	if err != nil {
		t.Fatalf("failed to insert test report snapshot: %v", err)
	}
	id, _ := uuid.Parse(snapIDStr)
	return id
}

func createOpenCampaign(t *testing.T, pool *pgxpool.Pool, smeID uuid.UUID, target, minInvest int64) uuid.UUID {
	t.Helper()
	ctx := context.Background()
	var campIDStr string
	slug := "camp-" + uuid.NewString()[:8]
	err := pool.QueryRow(ctx, `
		INSERT INTO bursa_campaigns (
			sme_id, slug, title, scheme, target_amount_idr,
			min_investment_idr, return_share_bps, term_months, status, closes_at
		) VALUES (
			$1, $2, 'Kampanye Test', 'revenue_sharing', $3,
			$4, 1500, 12, 'open', NOW() + INTERVAL '30 days'
		) RETURNING id::text
	`, smeID, slug, target, minInvest).Scan(&campIDStr)
	if err != nil {
		t.Fatalf("failed to insert open campaign: %v", err)
	}
	id, _ := uuid.Parse(campIDStr)
	return id
}

func TestBursa_InvestValidationLimits(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	payProvider := payment.NewSimulatedProvider()
	investSvc := bursa.NewInvestService(pool, q, payProvider)

	smeID, ownerID := createTestSME(t, pool)
	createTestReadinessScore(t, pool, smeID, 88, true)
	campID := createOpenCampaign(t, pool, smeID, 50_000_000, 1_000_000)

	investorID := createTestUser(t, pool, "investor")

	_, err := investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     investorID,
		CampaignID:     campID,
		IdempotencyKey: "idem-exceed-" + uuid.NewString(),
		RequestHash:    []byte("hash"),
		AmountIDR:      60_000_000,
	})
	if err == nil || !strings.Contains(err.Error(), "melebihi sisa target") {
		t.Fatalf("expected TARGET_EXCEEDED error, got: %v", err)
	}

	_, err = investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     investorID,
		CampaignID:     campID,
		IdempotencyKey: "idem-below-" + uuid.NewString(),
		RequestHash:    []byte("hash"),
		AmountIDR:      500_000,
	})
	if err == nil || !strings.Contains(err.Error(), "di bawah batas minimal") {
		t.Fatalf("expected BELOW_MIN_INVESTMENT error, got: %v", err)
	}

	_, err = investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     ownerID,
		CampaignID:     campID,
		IdempotencyKey: "idem-owner-" + uuid.NewString(),
		RequestHash:    []byte("hash"),
		AmountIDR:      5_000_000,
	})
	if err == nil || !strings.Contains(err.Error(), "Pemilik UMKM tidak dapat berinvestasi") {
		t.Fatalf("expected OWNER_CANNOT_INVEST error, got: %v", err)
	}

	inv, err := investSvc.Invest(ctx, bursa.InvestParam{
		InvestorID:     investorID,
		CampaignID:     campID,
		IdempotencyKey: "idem-valid-" + uuid.NewString(),
		RequestHash:    []byte("hash"),
		AmountIDR:      10_000_000,
	})
	if err != nil {
		t.Fatalf("expected valid investment to succeed, got: %v", err)
	}
	if inv.AmountIDR != 10_000_000 {
		t.Fatalf("expected amount 10_000_000, got: %d", inv.AmountIDR)
	}
}
