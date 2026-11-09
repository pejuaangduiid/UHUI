package aicopilot_test

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/cache"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/llm"
	"github.com/uhui/backend/internal/modules/aicopilot"
)

func TestHealthScoreNotFromLLM(t *testing.T) {
	bVal := 90
	scoreWithB := aicopilot.HealthScore(80, &bVal, 70)
	if scoreWithB != 80 {
		t.Fatalf("expected 80, got %d", scoreWithB)
	}

	scoreWithoutB := aicopilot.HealthScore(80, nil, 70)
	if scoreWithoutB != 75 {
		t.Fatalf("expected 75, got %d", scoreWithoutB)
	}

	scoreFloor := aicopilot.HealthScore(70, nil, 71)
	if scoreFloor != 70 {
		t.Fatalf("expected floor 70, got %d", scoreFloor)
	}
}

func TestR3_5_RejectsItemCountNot3(t *testing.T) {
	out2 := &llm.InsightOutput{
		SummaryText: "Arus kas sehat.",
		Anomalies:   []string{},
		ActionItems: []string{"Aksi 1", "Aksi 2"},
	}
	if err := llm.ValidateCopilotOutput(out2, nil); !errors.Is(err, llm.ErrActionItemCountNot3) {
		t.Fatalf("expected ErrActionItemCountNot3 for 2 items, got %v", err)
	}

	out4 := &llm.InsightOutput{
		SummaryText: "Arus kas sehat.",
		Anomalies:   []string{},
		ActionItems: []string{"Aksi 1", "Aksi 2", "Aksi 3", "Aksi 4"},
	}
	if err := llm.ValidateCopilotOutput(out4, nil); !errors.Is(err, llm.ErrActionItemCountNot3) {
		t.Fatalf("expected ErrActionItemCountNot3 for 4 items, got %v", err)
	}
}

func TestR3_5_RejectsForeignAnomalyID(t *testing.T) {
	out := &llm.InsightOutput{
		SummaryText: "Arus kas sehat.",
		Anomalies:   []string{"unknown_anomaly:999"},
		ActionItems: []string{"Aksi 1", "Aksi 2", "Aksi 3"},
	}
	allowed := []string{"dead_stock:item-1", "margin_drop"}
	if err := llm.ValidateCopilotOutput(out, allowed); !errors.Is(err, llm.ErrForeignAnomalyID) {
		t.Fatalf("expected ErrForeignAnomalyID for unknown anomaly, got %v", err)
	}
}

func TestR3_5_RejectsExcessLength(t *testing.T) {
	longSummary := strings.Repeat("A", 2005)
	out := &llm.InsightOutput{
		SummaryText: longSummary,
		Anomalies:   []string{},
		ActionItems: []string{"Aksi 1", "Aksi 2", "Aksi 3"},
	}
	if err := llm.ValidateCopilotOutput(out, nil); !errors.Is(err, llm.ErrSummaryTooLong) {
		t.Fatalf("expected ErrSummaryTooLong, got %v", err)
	}

	longAction := strings.Repeat("B", 205)
	outAction := &llm.InsightOutput{
		SummaryText: "Arus kas sehat.",
		Anomalies:   []string{},
		ActionItems: []string{"Aksi 1", "Aksi 2", longAction},
	}
	if err := llm.ValidateCopilotOutput(outAction, nil); !errors.Is(err, llm.ErrActionItemTooLong) {
		t.Fatalf("expected ErrActionItemTooLong, got %v", err)
	}
}

func TestR3_6_PromptNoPII(t *testing.T) {
	data := aicopilot.PromptData{
		PeriodDays:  14,
		SalesIDR:    5_000_000,
		ExpensesIDR: 3_000_000,
		NetCashIDR:  2_000_000,
		HealthScore: 82,
		Candidates: []aicopilot.CandidateAnomaly{
			{ID: "dead_stock:123", Type: "dead_stock", Title: "Barang Mati", Description: "Stok diam"},
		},
	}
	prompt, err := aicopilot.BuildPrompt(data)
	if err != nil {
		t.Fatalf("failed to build prompt: %v", err)
	}

	forbidden := []string{"@test.com", "Budi Santoso", "0812", "+62", "owner_id", "email"}
	for _, term := range forbidden {
		if strings.Contains(prompt, term) {
			t.Fatalf("prompt contains sensitive PII term: %q", term)
		}
	}
}

func TestR3_4_IntervalRecalc(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := aicopilot.NewService(q)

	smeID := createTestSMEDue(t, pool, "14_days", time.Now().Add(-1*time.Hour))

	res, err := svc.UpdateAISettings(ctx, smeID, "28_days")
	if err != nil {
		t.Fatalf("update ai settings failed: %v", err)
	}
	if res.Interval != "28_days" {
		t.Fatalf("expected 28_days, got %s", res.Interval)
	}
	if res.NextAIAnalysisAt == nil || res.NextAIAnalysisAt.Before(time.Now().Add(25*24*time.Hour)) {
		t.Fatalf("expected next analysis at ~28 days later, got %v", res.NextAIAnalysisAt)
	}

	disabledRes, err := svc.UpdateAISettings(ctx, smeID, "disabled")
	if err != nil {
		t.Fatalf("update to disabled failed: %v", err)
	}
	if disabledRes.NextAIAnalysisAt != nil {
		t.Fatalf("expected NULL next analysis for disabled interval, got %v", disabledRes.NextAIAnalysisAt)
	}
}

func TestR3_1_ParallelClaim(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)

	sme1 := createTestSMEDue(t, pool, "14_days", time.Now().Add(-2*time.Hour))
	sme2 := createTestSMEDue(t, pool, "14_days", time.Now().Add(-3*time.Hour))
	sme3 := createTestSMEDue(t, pool, "14_days", time.Now().Add(-4*time.Hour))

	targetIDs := map[string]bool{
		sme1.String(): true,
		sme2.String(): true,
		sme3.String(): true,
	}

	var mu sync.Mutex
	claimedMap := make(map[string]int)

	var wg sync.WaitGroup
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			rows, err := q.ClaimDueSMEs(ctx)
			if err != nil {
				return
			}
			mu.Lock()
			for _, r := range rows {
				idStr := uuid.UUID(r.ID.Bytes).String()
				if targetIDs[idStr] {
					claimedMap[idStr]++
				}
			}
			mu.Unlock()
		}()
	}
	wg.Wait()

	for id, count := range claimedMap {
		if count > 1 {
			t.Fatalf("sme %s was claimed %d times (expected exactly 1 across parallel workers)", id, count)
		}
	}
}

func TestR3_3_SuccessAdvancesSchedule(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	pipe := aicopilot.NewPipeline(pool, q, llm.NewFakeLLM(), cache.NewL1())

	pastTime := time.Now().Add(-2 * time.Hour)
	smeID := createTestSMEDue(t, pool, "14_days", pastTime)

	pgSmeID := pgtype.UUID{Bytes: smeID, Valid: true}
	err := pipe.RunAnalysis(ctx, pgSmeID, gen.AiScheduleInterval14Days)
	if err != nil {
		t.Fatalf("run analysis failed: %v", err)
	}

	sme, err := q.GetSMEByID(ctx, pgSmeID)
	if err != nil {
		t.Fatalf("get sme failed: %v", err)
	}

	if sme.AiClaimedAt.Valid {
		t.Fatalf("expected ai_claimed_at to be NULL on success, got %v", sme.AiClaimedAt.Time)
	}
	if !sme.NextAiAnalysisAt.Valid || !sme.NextAiAnalysisAt.Time.After(time.Now().Add(12*24*time.Hour)) {
		t.Fatalf("expected next analysis to advance ~14 days, got %v", sme.NextAiAnalysisAt.Time)
	}
}

func TestR3_3_FailureKeepsSchedule(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	failingLLM := &failingLLMClient{}
	pipe := aicopilot.NewPipeline(pool, q, failingLLM, cache.NewL1())

	pastTime := time.Now().Add(-5 * time.Hour).Truncate(time.Minute)
	smeID := createTestSMEDue(t, pool, "14_days", pastTime)

	pgSmeID := pgtype.UUID{Bytes: smeID, Valid: true}
	err := pipe.RunAnalysis(ctx, pgSmeID, gen.AiScheduleInterval14Days)
	if err == nil {
		t.Fatal("expected run analysis to fail with failing LLM")
	}

	sme, err := q.GetSMEByID(ctx, pgSmeID)
	if err != nil {
		t.Fatalf("get sme failed: %v", err)
	}

	if sme.AiClaimedAt.Valid {
		t.Fatalf("expected ai_claimed_at cleared on failure, got %v", sme.AiClaimedAt.Time)
	}
	if !sme.NextAiAnalysisAt.Valid || !sme.NextAiAnalysisAt.Time.Before(time.Now()) {
		t.Fatalf("expected next analysis unchanged on failure, got %v", sme.NextAiAnalysisAt.Time)
	}
}

type failingLLMClient struct{}

func (f *failingLLMClient) Name() string { return "failing-llm" }
func (f *failingLLMClient) ExtractReceipt(_ context.Context, _ []byte, _ string) (*llm.ReceiptProposal, error) {
	return nil, errors.New("extract failed")
}
func (f *failingLLMClient) GenerateInsight(_ context.Context, _ llm.InsightInput) (*llm.InsightOutput, error) {
	return nil, errors.New("llm generation quota exceeded")
}

func createTestSMEDue(t *testing.T, pool *pgxpool.Pool, interval string, nextAt time.Time) uuid.UUID {
	t.Helper()
	ctx := context.Background()
	var smeIDStr string
	err := pool.QueryRow(ctx, `
		WITH new_user AS (
			INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
			VALUES ('test-copilot-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Copilot Owner', 'sme_owner', NOW())
			RETURNING id
		)
		INSERT INTO smes (owner_id, business_name, slug, sector, ai_interval, next_ai_analysis_at)
		SELECT id, 'Copilot Mart', 'copilot-' || id, 'Retail', $1::ai_schedule_interval, $2
		FROM new_user
		RETURNING id::text
	`, interval, nextAt).Scan(&smeIDStr)
	if err != nil {
		t.Fatalf("failed to create due SME: %v", err)
	}
	parsed, err := uuid.Parse(smeIDStr)
	if err != nil {
		t.Fatalf("invalid uuid: %v", err)
	}
	return parsed
}
