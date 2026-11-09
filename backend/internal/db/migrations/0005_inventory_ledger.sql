-- +goose Up
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE CASCADE,
  sku VARCHAR(64) NOT NULL,
  name VARCHAR(200) NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  unit_cost_idr BIGINT NOT NULL CHECK (unit_cost_idr >= 0),
  selling_price_idr BIGINT NOT NULL CHECK (selling_price_idr >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sme_id, sku)
);

CREATE TABLE receipt_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  object_key TEXT NOT NULL,
  sha256 BYTEA NOT NULL,
  proposal_json JSONB NOT NULL,
  ocr_total_idr BIGINT NOT NULL CHECK (ocr_total_idr > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE operational_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tx_type VARCHAR(20) NOT NULL CHECK (tx_type IN ('sale','expense','restock')),
  total_amount_idr BIGINT NOT NULL CHECK (total_amount_idr > 0),
  description TEXT NOT NULL,
  proof_object_key TEXT,
  proof_sha256 BYTEA,
  ocr_total_idr BIGINT,
  duplicate_suspect BOOLEAN NOT NULL DEFAULT FALSE,
  is_ocr_verified BOOLEAN NOT NULL DEFAULT FALSE,
  reverses_tx_id UUID REFERENCES operational_transactions(id),
  tx_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (is_ocr_verified = FALSE OR (proof_object_key IS NOT NULL
         AND ocr_total_idr = total_amount_idr AND duplicate_suspect = FALSE))
);
CREATE UNIQUE INDEX uq_tx_proof ON operational_transactions(sme_id, proof_sha256) WHERE proof_sha256 IS NOT NULL;
CREATE UNIQUE INDEX uq_tx_reverses ON operational_transactions(reverses_tx_id) WHERE reverses_tx_id IS NOT NULL;

CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id UUID NOT NULL REFERENCES operational_transactions(id) ON DELETE RESTRICT,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT,
  description VARCHAR(200) NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price_idr BIGINT NOT NULL CHECK (unit_price_idr >= 0),
  unit_cost_idr BIGINT CHECK (unit_cost_idr >= 0),
  line_total_idr BIGINT NOT NULL CHECK (line_total_idr >= 0),
  CHECK (line_total_idr = qty * unit_price_idr)
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES smes(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  tx_id UUID REFERENCES operational_transactions(id) ON DELETE RESTRICT,
  delta_qty INTEGER NOT NULL CHECK (delta_qty <> 0),
  reason VARCHAR(30) NOT NULL CHECK (reason IN ('sale','restock','adjustment','reversal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger is append-only; UPDATE, DELETE and TRUNCATE are prohibited';
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER trg_op_tx_immutable
BEFORE UPDATE OR DELETE ON operational_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_op_tx_truncate
BEFORE TRUNCATE ON operational_transactions
FOR EACH STATEMENT EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_tx_items_immutable
BEFORE UPDATE OR DELETE ON transaction_items
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_tx_items_truncate
BEFORE TRUNCATE ON transaction_items
FOR EACH STATEMENT EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_stock_movements_immutable
BEFORE UPDATE OR DELETE ON stock_movements
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_stock_movements_truncate
BEFORE TRUNCATE ON stock_movements
FOR EACH STATEMENT EXECUTE FUNCTION prevent_ledger_mutation();

-- +goose Down
DROP TRIGGER IF EXISTS trg_stock_movements_truncate ON stock_movements;
DROP TRIGGER IF EXISTS trg_stock_movements_immutable ON stock_movements;
DROP TRIGGER IF EXISTS trg_tx_items_truncate ON transaction_items;
DROP TRIGGER IF EXISTS trg_tx_items_immutable ON transaction_items;
DROP TRIGGER IF EXISTS trg_op_tx_truncate ON operational_transactions;
DROP TRIGGER IF EXISTS trg_op_tx_immutable ON operational_transactions;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS operational_transactions;
DROP TABLE IF EXISTS receipt_scans;
DROP TABLE IF EXISTS inventory_items;

