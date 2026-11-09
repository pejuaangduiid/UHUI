-- +goose Up
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action VARCHAR(60) NOT NULL,
  entity VARCHAR(40) NOT NULL,
  entity_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_audit_log_truncate
BEFORE TRUNCATE ON audit_log
FOR EACH STATEMENT EXECUTE FUNCTION prevent_ledger_mutation();

CREATE INDEX idx_smes_ai_due ON smes(next_ai_analysis_at) WHERE ai_interval <> 'disabled';
CREATE INDEX idx_tx_sme_date ON operational_transactions(sme_id, tx_date DESC);
CREATE INDEX idx_tx_sme_type_date ON operational_transactions(sme_id, tx_type, tx_date DESC);
CREATE INDEX idx_stock_item ON stock_movements(inventory_item_id, created_at DESC);
CREATE INDEX idx_scans_expiry ON receipt_scans(expires_at) WHERE consumed_at IS NULL;
CREATE INDEX idx_bursa_open ON bursa_campaigns(created_at DESC) WHERE status = 'open';
CREATE INDEX idx_campaign_close ON bursa_campaigns(closes_at) WHERE status = 'open';
CREATE INDEX idx_inv_campaign ON investments(campaign_id) WHERE status = 'confirmed';
CREATE INDEX idx_inv_investor ON investments(investor_id);
CREATE INDEX idx_threads_board ON community_threads(sme_id, visibility, created_at DESC);
CREATE INDEX idx_readiness_sme ON readiness_scores(sme_id, computed_at DESC);

-- +goose Down
DROP TABLE IF EXISTS audit_log;

