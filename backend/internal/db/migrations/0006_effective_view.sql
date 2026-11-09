-- +goose Up
CREATE VIEW effective_transactions AS
SELECT t.* FROM operational_transactions t
WHERE t.reverses_tx_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM operational_transactions r WHERE r.reverses_tx_id = t.id);

-- +goose Down
DROP VIEW IF EXISTS effective_transactions;

