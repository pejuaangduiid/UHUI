-- +goose Up
CREATE TABLE bursa_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE RESTRICT,
  readiness_score_id UUID REFERENCES readiness_scores(id),
  slug VARCHAR(220) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  scheme funding_scheme NOT NULL,
  target_amount_idr BIGINT NOT NULL CHECK (target_amount_idr > 0),
  raised_amount_idr BIGINT NOT NULL DEFAULT 0 CHECK (raised_amount_idr >= 0 AND raised_amount_idr <= target_amount_idr),
  min_investment_idr BIGINT NOT NULL CHECK (min_investment_idr > 0),
  return_share_bps SMALLINT NOT NULL CHECK (return_share_bps BETWEEN 100 AND 9000),
  term_months SMALLINT NOT NULL CHECK (term_months BETWEEN 1 AND 120),
  status campaign_status NOT NULL DEFAULT 'draft',
  reviewed_by UUID REFERENCES users(id),
  review_note TEXT,
  funded_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_one_active_campaign ON bursa_campaigns(sme_id) WHERE status IN ('in_review','open');

CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES bursa_campaigns(id) ON DELETE RESTRICT,
  investor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_idr BIGINT NOT NULL CHECK (amount_idr > 0),
  status investment_status NOT NULL DEFAULT 'pending',
  idempotency_key VARCHAR(128) NOT NULL,
  request_hash BYTEA NOT NULL,
  payment_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investor_id, idempotency_key)
);

CREATE TABLE profit_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES bursa_campaigns(id) ON DELETE RESTRICT,
  report_snapshot_id UUID NOT NULL REFERENCES report_snapshots(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pool_idr BIGINT NOT NULL CHECK (pool_idr >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, period_start, period_end)
);

CREATE TABLE distribution_items (
  distribution_id UUID NOT NULL REFERENCES profit_distributions(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE RESTRICT,
  amount_idr BIGINT NOT NULL CHECK (amount_idr >= 0),
  PRIMARY KEY (distribution_id, investment_id)
);

-- +goose Down
DROP TABLE IF EXISTS distribution_items;
DROP TABLE IF EXISTS profit_distributions;
DROP TABLE IF EXISTS investments;
DROP TABLE IF EXISTS bursa_campaigns;

