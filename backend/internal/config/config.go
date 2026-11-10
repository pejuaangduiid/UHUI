package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv          string
	HTTPAddr        string
	DatabaseURL     string
	TestDatabaseURL string
	AllowedOrigin   string
	TrustedProxies  []string
	CookieInsecure  bool
	AutoMigrate     bool
	GeminiAPIKey    string
	GeminiModel     string
}

func Load() (*Config, error) {
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	cfg := &Config{
		TrustedProxies:  strings.Split(getEnv("TRUSTED_PROXIES", "127.0.0.1"), ","),
		AppEnv:          getEnv("APP_ENV", "dev"),
		HTTPAddr:        getEnv("HTTP_ADDR", ":8080"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		TestDatabaseURL: os.Getenv("TEST_DATABASE_URL"),
		AllowedOrigin:   getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
		CookieInsecure:  getEnv("COOKIE_INSECURE_DEV", "false") == "true",
		AutoMigrate:     getEnv("AUTO_MIGRATE", "false") == "true",
		GeminiAPIKey:    os.Getenv("GEMINI_API_KEY"),
		GeminiModel:     getEnv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
	}

	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("config: %w", err)
	}

	return cfg, nil
}

func (c *Config) validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}

	if c.CookieInsecure && c.AppEnv != "dev" {
		return fmt.Errorf("COOKIE_INSECURE_DEV=true is only allowed when APP_ENV=dev")
	}

	return nil
}

func (c *Config) IsDev() bool {
	return c.AppEnv == "dev"
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
