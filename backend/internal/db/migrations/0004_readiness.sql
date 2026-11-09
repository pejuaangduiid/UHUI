-- +goose Up
CREATE TABLE readiness_config (
  version INTEGER PRIMARY KEY,
  weights_json JSONB NOT NULL,
  min_listing_score SMALLINT NOT NULL DEFAULT 75,
  min_history_days SMALLINT NOT NULL DEFAULT 30,
  n_min_restock SMALLINT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO readiness_config (version, weights_json, min_listing_score, min_history_days, n_min_restock)
VALUES (
  1,
  '{"w":{"a":25,"b":25,"c":25,"d":25},"d_items":{"micro_equity":{"profile":15,"nib":30,"npwp":20,"bank_account":15,"pt_deed":20},"revenue_sharing":{"profile":20,"nib":35,"npwp":25,"bank_account":20,"pt_deed":0}}}'::jsonb,
  75,
  30,
  5
);

CREATE TABLE readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE CASCADE,
  scheme funding_scheme NOT NULL,
  scoring_version INTEGER NOT NULL REFERENCES readiness_config(version),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  component_a SMALLINT NOT NULL CHECK (component_a BETWEEN 0 AND 100),
  component_b SMALLINT CHECK (component_b BETWEEN 0 AND 100),
  component_c SMALLINT NOT NULL CHECK (component_c BETWEEN 0 AND 100),
  component_d SMALLINT NOT NULL CHECK (component_d BETWEEN 0 AND 100),
  total SMALLINT CHECK (total BETWEEN 0 AND 100),
  gate_passed BOOLEAN NOT NULL,
  gate_failures_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((total IS NULL) = (component_b IS NULL)),
  CHECK (gate_passed = FALSE OR total IS NOT NULL)
);

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION prevent_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Table is immutable (append-only); UPDATE and DELETE are prohibited';
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER trg_readiness_config_immutable
BEFORE UPDATE OR DELETE ON readiness_config
FOR EACH ROW EXECUTE FUNCTION prevent_update_delete();

CREATE TRIGGER trg_readiness_scores_immutable
BEFORE UPDATE OR DELETE ON readiness_scores
FOR EACH ROW EXECUTE FUNCTION prevent_update_delete();

-- +goose Down
DROP TRIGGER IF EXISTS trg_readiness_scores_immutable ON readiness_scores;
DROP TRIGGER IF EXISTS trg_readiness_config_immutable ON readiness_config;
DROP TABLE IF EXISTS readiness_scores;
DROP TABLE IF EXISTS readiness_config;

