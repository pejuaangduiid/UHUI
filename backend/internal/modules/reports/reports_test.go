package reports_test

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/modules/reports"
)

func TestR4_1_CanonicalHashDeterministic(t *testing.T) {
	payload1 := map[string]any{
		"sme_id":       "123e4567-e89b-12d3-a456-426614174000",
		"doc_type":     "sak_emkm",
		"period_start": "2026-10-01",
		"period_end":   "2026-10-31",
		"revenue_idr":  int64(10_000_000),
		"net_profit":   int64(3_500_000),
	}
	payload2 := map[string]any{
		"net_profit":   int64(3_500_000),
		"period_end":   "2026-10-31",
		"revenue_idr":  int64(10_000_000),
		"period_start": "2026-10-01",
		"doc_type":     "sak_emkm",
		"sme_id":       "123e4567-e89b-12d3-a456-426614174000",
	}

	bytes1, err := reports.Canonicalize(payload1)
	if err != nil {
		t.Fatalf("canonicalize 1 failed: %v", err)
	}
	bytes2, err := reports.Canonicalize(payload2)
	if err != nil {
		t.Fatalf("canonicalize 2 failed: %v", err)
	}

	hash1 := reports.HexFromHash(reports.ComputeHash(bytes1))
	hash2 := reports.HexFromHash(reports.ComputeHash(bytes2))

	if hash1 != hash2 {
		t.Fatalf("expected identical hash for same keys in different map order, got %s != %s", hash1, hash2)
	}
}

func TestR4_1_HashChangesWhenPayloadChanges(t *testing.T) {
	payload1 := map[string]any{
		"sme_id":      "123e4567-e89b-12d3-a456-426614174000",
		"doc_type":    "sak_emkm",
		"revenue_idr": int64(10_000_000),
	}
	payload2 := map[string]any{
		"sme_id":      "123e4567-e89b-12d3-a456-426614174000",
		"doc_type":    "sak_emkm",
		"revenue_idr": int64(10_000_001),
	}

	b1, _ := reports.Canonicalize(payload1)
	b2, _ := reports.Canonicalize(payload2)

	h1 := reports.HexFromHash(reports.ComputeHash(b1))
	h2 := reports.HexFromHash(reports.ComputeHash(b2))

	if h1 == h2 {
		t.Fatal("expected different hashes for modified payload")
	}
}

func TestR4_1_SamePayloadReturnsExistingSnapshot(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := reports.NewService(q)

	smeID := createTestSMEReport(t, pool, false)
	periodMonth := "2026-10"

	snap1, err := svc.GetOrCreateSnapshot(ctx, smeID, "sak_emkm", periodMonth)
	if err != nil {
		t.Fatalf("first snapshot failed: %v", err)
	}

	snap2, err := svc.GetOrCreateSnapshot(ctx, smeID, "sak_emkm", periodMonth)
	if err != nil {
		t.Fatalf("second snapshot failed: %v", err)
	}

	if snap1.SHA256 != snap2.SHA256 {
		t.Fatalf("expected same sha256, got %s != %s", snap1.SHA256, snap2.SHA256)
	}
	if snap1.ID != snap2.ID {
		t.Fatalf("expected same snapshot ID from ON CONFLICT SELECT, got %s != %s", snap1.ID, snap2.ID)
	}
}

func TestR4_2_VerifyHidesFiguresByDefault(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := reports.NewService(q)

	smeID := createTestSMEReport(t, pool, false)
	snap, err := svc.GetOrCreateSnapshot(ctx, smeID, "sak_emkm", "2026-10")
	if err != nil {
		t.Fatalf("create snapshot failed: %v", err)
	}

	pub, err := svc.GetPublicVerification(ctx, snap.SHA256)
	if err != nil {
		t.Fatalf("public verify failed: %v", err)
	}

	if pub.Status != "authentic" {
		t.Fatalf("expected status authentic, got %s", pub.Status)
	}
	if pub.Figures != nil {
		t.Fatalf("expected figures to be hidden when verify_show_figures=false, got %+v", pub.Figures)
	}
}

func TestR4_2_VerifyShowsFiguresWhenEnabled(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := reports.NewService(q)

	smeID := createTestSMEReport(t, pool, true)
	snap, err := svc.GetOrCreateSnapshot(ctx, smeID, "sak_emkm", "2026-10")
	if err != nil {
		t.Fatalf("create snapshot failed: %v", err)
	}

	pub, err := svc.GetPublicVerification(ctx, snap.SHA256)
	if err != nil {
		t.Fatalf("public verify failed: %v", err)
	}

	if pub.Figures == nil {
		t.Fatal("expected figures to be visible when verify_show_figures=true")
	}
}

func TestR1_5_VerifyNoTransactionIDs(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := reports.NewService(q)

	smeID := createTestSMEReport(t, pool, true)
	snap, err := svc.GetOrCreateSnapshot(ctx, smeID, "sak_emkm", "2026-10")
	if err != nil {
		t.Fatalf("create snapshot failed: %v", err)
	}

	pub, err := svc.GetPublicVerification(ctx, snap.SHA256)
	if err != nil {
		t.Fatalf("get public verification failed: %v", err)
	}

	jsonBytes, err := json.Marshal(pub)
	if err != nil {
		t.Fatalf("marshal pub failed: %v", err)
	}

	forbiddenKeys := []string{"tx_id", "transaction_id", "owner_id", "password", "email"}
	jsonStr := strings.ToLower(string(jsonBytes))
	for _, key := range forbiddenKeys {
		if strings.Contains(jsonStr, `"`+key+`"`) {
			t.Fatalf("public projection leaked sensitive key: %s", key)
		}
	}
}

func createTestSMEReport(t *testing.T, pool *pgxpool.Pool, showFigures bool) uuid.UUID {
	t.Helper()
	ctx := context.Background()
	var smeIDStr string
	err := pool.QueryRow(ctx, `
		WITH new_user AS (
			INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
			VALUES ('test-rep-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Report Owner', 'sme_owner', NOW())
			RETURNING id
		)
		INSERT INTO smes (owner_id, business_name, slug, sector, verify_show_figures, ai_interval, next_ai_analysis_at)
		SELECT id, 'Warung Berkah', 'warung-' || id, 'Kuliner', $1, 'disabled'::ai_schedule_interval, NULL
		FROM new_user
		RETURNING id::text
	`, showFigures).Scan(&smeIDStr)
	if err != nil {
		t.Fatalf("failed to create test SME: %v", err)
	}
	parsed, err := uuid.Parse(smeIDStr)
	if err != nil {
		t.Fatalf("invalid uuid: %v", err)
	}
	return parsed
}
