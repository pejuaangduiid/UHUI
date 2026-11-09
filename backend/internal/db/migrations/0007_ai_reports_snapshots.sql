-- +goose Up
CREATE TABLE ai_diagnostic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE CASCADE,
  period_days SMALLINT NOT NULL CHECK (period_days IN (14, 28)),
  health_score SMALLINT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  summary_text TEXT NOT NULL,
  anomalies_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_name VARCHAR(80) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE CASCADE,
  doc_type VARCHAR(30) NOT NULL CHECK (doc_type IN ('sak_emkm','prospectus','shareholder_monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payload_json JSONB NOT NULL,
  sha256 BYTEA UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_report_snapshots_immutable
BEFORE UPDATE OR DELETE ON report_snapshots
FOR EACH ROW EXECUTE FUNCTION prevent_update_delete();

-- +goose Down
DROP TRIGGER IF EXISTS trg_report_snapshots_immutable ON report_snapshots;
DROP TABLE IF EXISTS report_snapshots;
DROP TABLE IF EXISTS ai_diagnostic_reports;

