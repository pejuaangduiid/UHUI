package sme_test

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"testing"

	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/middleware"
	"github.com/uhui/backend/internal/modules/auth"
	"github.com/uhui/backend/internal/modules/sme"
)

func randomEmail() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return fmt.Sprintf("test-sme-%s@uhui.id", hex.EncodeToString(b))
}

func TestCreateMySME(t *testing.T) {
	pool := db.OpenTestPool(t)
	tm, err := middleware.NewTokenManager(nil, nil)
	if err != nil {
		t.Fatalf("failed to create TokenManager: %v", err)
	}

	authSvc := auth.NewService(pool, tm)
	smeSvc := sme.NewService(pool, nil)

	ctx := context.Background()
	email := randomEmail()
	regRes, err := authSvc.Register(ctx, auth.RegisterInput{
		Email:        email,
		Password:     "Password123!",
		FullName:     "Pemilik Kopi",
		Role:         "sme_owner",
		BusinessName: "Kopi Awal",
		Sector:       "Kuliner",
		PdpConsent:   true,
	})
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	newSme, err := smeSvc.CreateMySME(ctx, regRes.User.ID, sme.CreateSMEInput{
		BusinessName:     "Kopi Kenangun",
		Sector:           "Kuliner & Kafe",
		Description:      "Kopi mahal gak enak",
		IsIncorporatedPt: true,
	})
	if err != nil {
		t.Fatalf("CreateMySME failed: %v", err)
	}

	if newSme.BusinessName != "Kopi Kenangun" {
		t.Fatalf("expected business name Kopi Kenangun, got %s", newSme.BusinessName)
	}
	if !newSme.IsIncorporatedPt {
		t.Fatalf("expected IsIncorporatedPt to be true")
	}

	list, err := smeSvc.ListMySMEs(ctx, regRes.User.ID)
	if err != nil {
		t.Fatalf("ListMySMEs failed: %v", err)
	}
	if len(list) < 2 {
		t.Fatalf("expected at least 2 smes, got %d", len(list))
	}
}
