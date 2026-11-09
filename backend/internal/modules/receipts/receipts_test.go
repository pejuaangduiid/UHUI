package receipts_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/cache"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/llm"
	"github.com/uhui/backend/internal/modules/receipts"
	"github.com/uhui/backend/internal/storage"
)

func setupTestReceiptService(t *testing.T) (*receipts.Service, pgtype.UUID, pgtype.UUID) {
	t.Helper()
	ctx := context.Background()
	pool := db.OpenTestPool(t)

	var smeIDStr, ownerIDStr string
	err := pool.QueryRow(ctx, `
		WITH new_user AS (
			INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
			VALUES ('test-rcpt-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Receipt User', 'sme_owner', NOW())
			RETURNING id
		)
		INSERT INTO smes (owner_id, business_name, slug, sector, ai_interval)
		SELECT id, 'Receipt Store', 'rcpt-' || id, 'Retail', 'disabled'::ai_schedule_interval FROM new_user
		RETURNING id::text, owner_id::text
	`).Scan(&smeIDStr, &ownerIDStr)
	if err != nil {
		t.Fatalf("failed to setup test SME: %v", err)
	}

	var smeID, ownerID pgtype.UUID
	_ = smeID.Scan(smeIDStr)
	_ = ownerID.Scan(ownerIDStr)

	store, err := storage.NewLocalFS("./tmp/test_storage_"+smeIDStr[:6], []byte("test-secret-12345678901234567890"), "http://localhost:8080")
	if err != nil {
		t.Fatalf("failed to create test storage: %v", err)
	}

	limiter := cache.NewOCRRateLimiter()
	svc := receipts.NewService(pool, store, llm.NewFakeLLM(), limiter)

	return svc, smeID, ownerID
}

func validJPEG() []byte {

	return append([]byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 'J', 'F', 'I', 'F'}, []byte("sample receipt data")...)
}

func TestR1_3_SameHashRejected(t *testing.T) {
	ctx := context.Background()
	svc, smeID, ownerID := setupTestReceiptService(t)

	img := validJPEG()

	res1, err := svc.ScanReceipt(ctx, smeID, ownerID, img, "receipt.jpg")
	if err != nil {
		t.Fatalf("first scan failed: %v", err)
	}
	if res1.ScanID == "" {
		t.Fatal("expected non-empty scan_id")
	}

	_, err = svc.ScanReceipt(ctx, smeID, ownerID, img, "receipt.jpg")
	if err == nil {
		t.Fatal("expected second scan of identical image to fail with DUPLICATE_PROOF, but succeeded")
	}

	appErr, ok := err.(*apperr.Error)
	if !ok || appErr.Code != apperr.CodeDuplicateProof {
		t.Fatalf("expected error code DUPLICATE_PROOF, got: %v", err)
	}
}

func TestR1_9_RateLimit10PerHour(t *testing.T) {
	ctx := context.Background()
	svc, smeID, ownerID := setupTestReceiptService(t)

	for i := 0; i < 10; i++ {

		img := append(validJPEG(), []byte(time.Now().Format(time.RFC3339Nano))...)
		_, err := svc.ScanReceipt(ctx, smeID, ownerID, img, "receipt.jpg")
		if err != nil {
			t.Fatalf("scan %d failed unexpectedly: %v", i+1, err)
		}
	}

	img11 := append(validJPEG(), []byte("unique-11")...)
	_, err := svc.ScanReceipt(ctx, smeID, ownerID, img11, "receipt.jpg")
	if err == nil {
		t.Fatal("expected 11th scan to be rate-limited, but it succeeded")
	}

	appErr, ok := err.(*apperr.Error)
	if !ok || appErr.Code != apperr.CodeRateLimitExceeded {
		t.Fatalf("expected error code RATE_LIMIT_EXCEEDED, got: %v", err)
	}
}

func TestR8_4_ScanMagicBytes(t *testing.T) {
	ctx := context.Background()
	svc, smeID, ownerID := setupTestReceiptService(t)

	invalidFile := []byte("MZ\x90\x00not an image file")
	_, err := svc.ScanReceipt(ctx, smeID, ownerID, invalidFile, "receipt.jpg")
	if err == nil {
		t.Fatal("expected invalid magic bytes to be rejected, but it succeeded")
	}

	if !strings.Contains(err.Error(), "Format file") {
		t.Errorf("expected format file error, got: %v", err)
	}
}
