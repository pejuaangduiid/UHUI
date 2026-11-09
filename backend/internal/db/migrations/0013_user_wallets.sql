-- +goose Up
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_idr BIGINT NOT NULL DEFAULT 50000000 CHECK (balance_idr >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS user_wallets;

