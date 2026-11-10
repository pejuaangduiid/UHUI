package ojk

import (
	"context"
	"testing"
)

func TestDefaultSCFPartnersFallback(t *testing.T) {
	partners := DefaultSCFPartners()
	if len(partners) < 5 {
		t.Fatalf("expected at least 5 fallback partners, got %d", len(partners))
	}

	foundBizhare := false
	for _, p := range partners {
		if p.BrandName == "Bizhare" {
			foundBizhare = true
			if p.LicenseNumber == "" {
				t.Errorf("expected Bizhare to have a license number")
			}
		}
	}
	if !foundBizhare {
		t.Errorf("expected Bizhare in fallback partners")
	}
}

func TestCheckEntityOfflineFallback(t *testing.T) {
	svc := NewService(nil, nil)
	ctx := context.Background()

	// 1. Test empty query
	resEmpty, err := svc.CheckEntity(ctx, "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resEmpty.Status != "NOT_FOUND_CLEAN" {
		t.Errorf("expected NOT_FOUND_CLEAN for empty query, got %s", resEmpty.Status)
	}

	// 2. Test search for licensed partner in fallback
	resLic, err := svc.CheckEntity(ctx, "Bizhare")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resLic.Status != "VERIFIED_LICENSED" {
		t.Errorf("expected VERIFIED_LICENSED, got %s", resLic.Status)
	}
	if len(resLic.LicensedMatches) == 0 {
		t.Errorf("expected licensed matches for Bizhare")
	}

	// 3. Test search for illegal entity in fallback
	resIll, err := svc.CheckEntity(ctx, "Saham Kilat")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resIll.Status != "ILLEGAL_WARNING" {
		t.Errorf("expected ILLEGAL_WARNING, got %s", resIll.Status)
	}
	if len(resIll.IllegalMatches) == 0 {
		t.Errorf("expected illegal matches for Saham Kilat")
	}
}

