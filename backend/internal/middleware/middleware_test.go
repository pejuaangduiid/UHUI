package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/uhui/backend/internal/config"
	"github.com/uhui/backend/internal/middleware"
)

func TestR8_2_NonGetWithoutOriginRejected(t *testing.T) {
	cfg := &config.Config{
		AllowedOrigin: "http://localhost:3000",
		AppEnv:        "dev",
	}

	app := fiber.New()
	app.Use(middleware.OriginCSRF(cfg))
	app.Post("/test", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected app.Test error: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden without Origin, got %d", resp.StatusCode)
	}

	req = httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Origin", "http://evil.com")
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("unexpected app.Test error: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden with evil origin, got %d", resp.StatusCode)
	}

	req = httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("unexpected app.Test error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200 OK with valid origin, got %d", resp.StatusCode)
	}

	app.Get("/test-get", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})
	req = httptest.NewRequest(http.MethodGet, "/test-get", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("unexpected app.Test error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200 OK for GET request, got %d", resp.StatusCode)
	}
}

func TestAuthJWT_TokenManager(t *testing.T) {
	tm, err := middleware.NewTokenManager(nil, nil)
	if err != nil {
		t.Fatalf("failed to create TokenManager: %v", err)
	}

	tokenStr, err := tm.SignAccess("user-uuid-123", "sme_owner")
	if err != nil {
		t.Fatalf("SignAccess error: %v", err)
	}

	principal, err := tm.VerifyAccess(tokenStr)
	if err != nil {
		t.Fatalf("VerifyAccess error: %v", err)
	}

	if principal.UserID != "user-uuid-123" {
		t.Errorf("expected user-uuid-123, got %s", principal.UserID)
	}
	if principal.Role != "sme_owner" {
		t.Errorf("expected sme_owner, got %s", principal.Role)
	}

	_, err = tm.VerifyAccess("invalid.token.structure")
	if err == nil {
		t.Errorf("expected error verifying invalid token")
	}

	ctx := context.WithValue(context.Background(), middleware.PrincipalContextKey, principal)
	p, ok := middleware.GetPrincipal(ctx)
	if !ok || p.UserID != "user-uuid-123" {
		t.Errorf("GetPrincipal failed to retrieve principal from context")
	}
}
