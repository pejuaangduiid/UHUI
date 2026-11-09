package auth_test

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"testing"

	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/middleware"
	"github.com/uhui/backend/internal/modules/auth"
)

func randomEmail() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return fmt.Sprintf("test-%s@uhui.id", hex.EncodeToString(b))
}

func testRegisterAndLogin(t *testing.T, svc *auth.Service, email, pass string) (*auth.AuthResult, *auth.AuthResult) {
	t.Helper()
	ctx := context.Background()

	regRes, err := svc.Register(ctx, auth.RegisterInput{
		Email:        email,
		Password:     pass,
		FullName:     "Pemilik Sukses",
		Role:         "sme_owner",
		BusinessName: "Warung Sukses",
		Sector:       "Kuliner",
		PdpConsent:   true,
	})
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}
	if regRes.AccessToken == "" || regRes.RefreshToken == "" || regRes.SMEID == "" {
		t.Fatalf("expected non-empty tokens and SMEID on register, got: %+v", regRes)
	}

	loginRes, err := svc.Login(ctx, email, pass)
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}
	if loginRes.AccessToken == "" || loginRes.RefreshToken == "" {
		t.Fatalf("expected non-empty tokens on login, got: %+v", loginRes)
	}

	return regRes, loginRes
}

func testRefreshAndReuseDetection(t *testing.T, svc *auth.Service, loginRes *auth.AuthResult) {
	t.Helper()
	ctx := context.Background()

	refRes, err := svc.Refresh(ctx, loginRes.RefreshToken)
	if err != nil {
		t.Fatalf("Refresh failed: %v", err)
	}
	if refRes.RefreshToken == loginRes.RefreshToken {
		t.Fatal("expected new refresh token after rotation, but got the same token")
	}

	_, err = svc.Refresh(ctx, loginRes.RefreshToken)
	if err == nil {
		t.Fatal("expected token reuse error, but refresh succeeded")
	}
	appErr, ok := err.(*apperr.Error)
	if !ok || appErr.Code != apperr.CodeTokenReused {
		t.Fatalf("expected CodeTokenReused, got: %v", err)
	}

	_, err = svc.Refresh(ctx, refRes.RefreshToken)
	if err == nil {
		t.Fatal("expected entire family to be revoked after reuse, but refresh succeeded")
	}
}

func TestR8_1_AuthFlow_Register_Login_Refresh_ReuseDetection(t *testing.T) {
	pool := db.OpenTestPool(t)
	tm, err := middleware.NewTokenManager(nil, nil)
	if err != nil {
		t.Fatalf("failed to create TokenManager: %v", err)
	}

	svc := auth.NewService(pool, tm)
	email := randomEmail()
	pass := "KuatB4nget!123"

	regRes, loginRes := testRegisterAndLogin(t, svc, email, pass)
	testRefreshAndReuseDetection(t, svc, loginRes)

	ctx := context.Background()
	src := regRes.User.ID.Bytes
	userIDStr := fmt.Sprintf("%x-%x-%x-%x-%x", src[0:4], src[4:6], src[6:8], src[8:10], src[10:16])
	user, smeID, err := svc.GetMe(ctx, userIDStr)
	if err != nil {
		t.Fatalf("GetMe failed: %v", err)
	}
	if smeID != regRes.SMEID || user.Email != email {
		t.Errorf("GetMe mismatched: smeID=%s (want %s), email=%s (want %s)", smeID, regRes.SMEID, user.Email, email)
	}
}
