package ledger_test

import (
	"context"
	"strings"
	"testing"

	"github.com/uhui/backend/internal/db"
)

func TestR1_7_LedgerTriggersRejectUpdateDeleteTruncate(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)

	var smeID string
	err := pool.QueryRow(ctx, `
		WITH new_user AS (
			INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
			VALUES ('dummy-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Dummy User', 'sme_owner', NOW())
			RETURNING id
		)
		INSERT INTO smes (owner_id, business_name, slug, sector, ai_interval)
		SELECT id, 'Dummy Biz', 'dummy-' || id, 'Retail', 'disabled'::ai_schedule_interval FROM new_user
		RETURNING id::text
	`).Scan(&smeID)
	if err != nil {
		t.Fatalf("failed to setup dummy SME: %v", err)
	}

	var txID string
	err = pool.QueryRow(ctx, `
		INSERT INTO operational_transactions (sme_id, created_by, tx_type, total_amount_idr, description)
		SELECT $1, owner_id, 'sale', 50000, 'Test Sale' FROM smes WHERE id = $1
		RETURNING id::text
	`, smeID).Scan(&txID)
	if err != nil {
		t.Fatalf("failed to insert operational_transaction: %v", err)
	}

	_, err = pool.Exec(ctx, "UPDATE operational_transactions SET total_amount_idr = 99999 WHERE id = $1", txID)
	if err == nil {
		t.Fatal("expected UPDATE on operational_transactions to fail, but it succeeded")
	}
	if !strings.Contains(err.Error(), "Ledger is append-only") {
		t.Errorf("expected append-only error, got: %v", err)
	}

	_, err = pool.Exec(ctx, "DELETE FROM operational_transactions WHERE id = $1", txID)
	if err == nil {
		t.Fatal("expected DELETE on operational_transactions to fail, but it succeeded")
	}
	if !strings.Contains(err.Error(), "Ledger is append-only") {
		t.Errorf("expected append-only error, got: %v", err)
	}
}
