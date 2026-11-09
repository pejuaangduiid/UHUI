package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/middleware"
)

func setupTwoTenants(t *testing.T, pool *pgxpool.Pool) (userA, sme1, userB, sme2 string) {
	t.Helper()
	ctx := context.Background()

	createTenant := func(label string) (string, string) {
		var uID, sID string
		err := pool.QueryRow(ctx, `
			WITH u AS (
				INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
				VALUES ('tenant-' || $1 || '-' || gen_random_uuid() || '@test.id', 'hash', 'Tenant ' || $1, 'sme_owner', NOW())
				RETURNING id
			)
			INSERT INTO smes (owner_id, business_name, slug, sector, ai_interval)
			SELECT id, 'Biz ' || $1, 'biz-' || $1 || '-' || id, 'Kuliner', 'disabled'::ai_schedule_interval FROM u
			RETURNING owner_id::text, id::text
		`, label).Scan(&uID, &sID)
		if err != nil {
			t.Fatalf("failed to create tenant %s: %v", label, err)
		}
		return uID, sID
	}

	userA, sme1 = createTenant("A")
	userB, sme2 = createTenant("B")
	return userA, sme1, userB, sme2
}

func TestR8_3_CrossTenantRejection(t *testing.T) {
	pool := db.OpenTestPool(t)
	userA, sme1, _, sme2 := setupTwoTenants(t, pool)

	app := fiber.New()
	app.Get("/smes/:sme_id/secret", func(c fiber.Ctx) error {
		uid := c.Get("X-User-ID")
		c.Locals("principal", &middleware.Principal{UserID: uid, Role: "sme_owner"})
		return c.Next()
	}, middleware.RequireSMEOwner(pool), func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/smes/"+sme1+"/secret", nil)
	req.Header.Set("X-User-ID", userA)
	resp, err := app.Test(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK for own tenant, got code=%d, err=%v", resp.StatusCode, err)
	}

	req = httptest.NewRequest(http.MethodGet, "/smes/"+sme2+"/secret", nil)
	req.Header.Set("X-User-ID", userA)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("unexpected app.Test error: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for cross-tenant access, got %d", resp.StatusCode)
	}

	ctx := context.WithValue(context.Background(), middleware.PrincipalContextKey, &middleware.Principal{
		UserID: userA,
		Role:   "sme_owner",
	})
	if _, err := middleware.CheckSMEOwner(ctx, pool, sme2); err == nil {
		t.Fatal("expected CheckSMEOwner to fail for cross-tenant access")
	} else if appErr, ok := err.(*apperr.Error); !ok || appErr.Code != apperr.CodeForbiddenTenant {
		t.Errorf("expected CodeForbiddenTenant, got %v", err)
	}
}
