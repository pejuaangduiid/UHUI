package db_test

import (
	"context"
	"strings"
	"testing"

	"github.com/uhui/backend/internal/db"
)

func TestR8_8_AuditLogAppendOnly(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)

	var logID int64
	err := pool.QueryRow(ctx, `
		INSERT INTO audit_log (action, entity, meta)
		VALUES ('TEST_APPEND', 'test', '{"sample": true}'::jsonb)
		RETURNING id
	`).Scan(&logID)
	if err != nil {
		t.Fatalf("failed to insert audit_log: %v", err)
	}

	_, err = pool.Exec(ctx, "UPDATE audit_log SET action = 'TAMPERED' WHERE id = $1", logID)
	if err == nil {
		t.Fatal("expected UPDATE on audit_log to fail, but it succeeded")
	}
	if !strings.Contains(strings.ToLower(err.Error()), "append-only") {
		t.Errorf("expected append-only error message, got: %v", err)
	}

	_, err = pool.Exec(ctx, "DELETE FROM audit_log WHERE id = $1", logID)
	if err == nil {
		t.Fatal("expected DELETE on audit_log to fail, but it succeeded")
	}
	if !strings.Contains(strings.ToLower(err.Error()), "append-only") {
		t.Errorf("expected append-only error message, got: %v", err)
	}

	_, err = pool.Exec(ctx, "TRUNCATE audit_log")
	if err == nil {
		t.Fatal("expected TRUNCATE on audit_log to fail, but it succeeded")
	}
	if !strings.Contains(strings.ToLower(err.Error()), "append-only") {
		t.Errorf("expected append-only error message on TRUNCATE, got: %v", err)
	}
}
