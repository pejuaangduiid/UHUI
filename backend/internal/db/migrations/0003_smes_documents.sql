-- +goose Up
CREATE TABLE smes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  business_name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) UNIQUE NOT NULL,
  sector VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_incorporated_pt BOOLEAN NOT NULL DEFAULT FALSE,
  digital_readiness_score SMALLINT CHECK (digital_readiness_score BETWEEN 0 AND 100),
  is_listed_on_bursa BOOLEAN NOT NULL DEFAULT FALSE,
  verify_show_figures BOOLEAN NOT NULL DEFAULT FALSE,
  ai_interval ai_schedule_interval NOT NULL DEFAULT '14_days',
  next_ai_analysis_at TIMESTAMPTZ,
  ai_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((ai_interval = 'disabled') = (next_ai_analysis_at IS NULL))
);

CREATE TABLE sme_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE CASCADE,
  doc_type VARCHAR(30) NOT NULL CHECK (doc_type IN ('nib','npwp','business_bank_account','pt_deed')),
  storage_key TEXT NOT NULL,
  status review_status NOT NULL DEFAULT 'pending',
  review_note TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sme_id, doc_type)
);

-- +goose Down
DROP TABLE IF EXISTS sme_documents;
DROP TABLE IF EXISTS smes;

