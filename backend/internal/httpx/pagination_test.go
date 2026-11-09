package httpx_test

import (
	"testing"

	"github.com/uhui/backend/internal/httpx"
)

func TestPagination(t *testing.T) {
	p := httpx.Pagination{Limit: 200}
	p.Normalize()
	if p.Limit != 100 {
		t.Errorf("expected limit 100, got %d", p.Limit)
	}

	p2 := httpx.Pagination{Limit: -5}
	p2.Normalize()
	if p2.Limit != 20 {
		t.Errorf("expected limit 20, got %d", p2.Limit)
	}

	raw := "2026-10-29T10:00:00Z|abc-123"
	cursor := httpx.EncodeCursor(raw)
	if cursor == "" {
		t.Fatal("expected non-empty cursor")
	}

	decoded, err := httpx.DecodeCursor(cursor)
	if err != nil {
		t.Fatalf("unexpected decode error: %v", err)
	}
	if decoded != raw {
		t.Errorf("expected %s, got %s", raw, decoded)
	}

	_, err = httpx.DecodeCursor("!invalid-base64!")
	if err == nil {
		t.Errorf("expected error for invalid cursor")
	}
}
