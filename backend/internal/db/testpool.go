package db

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func OpenTestPool(t testing.TB) *pgxpool.Pool {
	t.Helper()

	_ = godotenv.Load("../../../../../.env")
	_ = godotenv.Load("../../../../.env")
	_ = godotenv.Load("../../../.env")
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL and DATABASE_URL not set; skipping DB test")
		return nil
	}

	ctx := context.Background()
	cfg, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		t.Fatalf("failed to parse DB URL: %v", err)
	}

	cfg.MaxConns = 8

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatalf("failed to create pool: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		t.Skipf("cannot connect to database (%v); skipping DB test", err)
		return nil
	}

	t.Cleanup(func() {
		pool.Close()
	})

	return pool
}
