package config_test

import (
	"strings"
	"testing"

	"github.com/uhui/backend/internal/config"
)

func TestRB_CFG_1_MissingRequiredEnv(t *testing.T) {
	t.Setenv("DATABASE_URL", "")

	cfg, err := config.Load()
	if err == nil {
		t.Fatalf("expected error when DATABASE_URL is missing, got nil (cfg=%+v)", cfg)
	}

	if !strings.Contains(err.Error(), "DATABASE_URL is required") {
		t.Errorf("expected error to mention 'DATABASE_URL is required', got: %v", err)
	}
}

func TestRB_CFG_1_CookieInsecureDevInNonDev(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/uhui_dev?sslmode=disable")
	t.Setenv("APP_ENV", "production")
	t.Setenv("COOKIE_INSECURE_DEV", "true")

	cfg, err := config.Load()
	if err == nil {
		t.Fatalf("expected error when COOKIE_INSECURE_DEV=true in production, got nil (cfg=%+v)", cfg)
	}

	if !strings.Contains(err.Error(), "COOKIE_INSECURE_DEV=true is only allowed when APP_ENV=dev") {
		t.Errorf("expected error about COOKIE_INSECURE_DEV, got: %v", err)
	}
}

func TestRB_CFG_1_ValidDevConfig(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/uhui_dev?sslmode=disable")
	t.Setenv("APP_ENV", "dev")
	t.Setenv("COOKIE_INSECURE_DEV", "true")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error loading valid dev config: %v", err)
	}

	if !cfg.IsDev() {
		t.Errorf("expected IsDev() to be true")
	}

	if !cfg.CookieInsecure {
		t.Errorf("expected CookieInsecure to be true")
	}
}
