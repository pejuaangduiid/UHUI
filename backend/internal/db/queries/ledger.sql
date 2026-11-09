-- name: CreateOperationalTransaction :one
INSERT INTO operational_transactions (
  sme_id, created_by, tx_type, total_amount_idr, description,
  proof_object_key, proof_sha256, ocr_total_idr, duplicate_suspect, is_ocr_verified,
  reverses_tx_id, tx_date
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING id, sme_id, created_by, tx_type, total_amount_idr, description,
  proof_object_key, proof_sha256, ocr_total_idr, duplicate_suspect, is_ocr_verified,
  reverses_tx_id, tx_date, created_at;

-- name: CreateTransactionItem :one
INSERT INTO transaction_items (
  tx_id, inventory_item_id, description, qty, unit_price_idr, line_total_idr
) VALUES (
  $1, $2, $3, $4, $5, $6
) RETURNING id, tx_id, inventory_item_id, description, qty, unit_price_idr, line_total_idr;

-- name: CreateStockMovement :one
INSERT INTO stock_movements (
  sme_id, inventory_item_id, tx_id, delta_qty, reason
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING id, sme_id, inventory_item_id, tx_id, delta_qty, reason, created_at;

-- name: ListStockMovements :many
SELECT id, sme_id, inventory_item_id, tx_id, delta_qty, reason, created_at
FROM stock_movements
WHERE sme_id = $1 AND inventory_item_id = $2
ORDER BY created_at DESC
LIMIT $3;


-- name: GetTransactionByID :one
SELECT id, sme_id, created_by, tx_type, total_amount_idr, description,
  proof_object_key, proof_sha256, ocr_total_idr, duplicate_suspect, is_ocr_verified,
  reverses_tx_id, tx_date, created_at
FROM operational_transactions
WHERE id = $1 AND sme_id = $2;

-- name: ListTransactions :many
SELECT id, sme_id, created_by, tx_type, total_amount_idr, description,
  proof_object_key, proof_sha256, ocr_total_idr, duplicate_suspect, is_ocr_verified,
  reverses_tx_id, tx_date, created_at
FROM operational_transactions
WHERE sme_id = $1
ORDER BY tx_date DESC, created_at DESC
LIMIT $2;

-- name: ListTransactionItems :many
SELECT ti.id, ti.tx_id, ti.inventory_item_id, ti.qty, ti.unit_price_idr, ti.line_total_idr, ii.name as item_name
FROM transaction_items ti
LEFT JOIN inventory_items ii ON ti.inventory_item_id = ii.id
WHERE ti.tx_id = $1;

-- name: CheckIfTransactionReversed :one
SELECT EXISTS(
  SELECT 1 FROM operational_transactions WHERE reverses_tx_id = $1
) AS is_reversed;

-- name: GetEffectiveAggregates30Days :one
SELECT
  COALESCE(SUM(CASE WHEN tx_type = 'sale' THEN total_amount_idr ELSE 0 END), 0)::BIGINT AS revenue_idr,
  COALESCE(SUM(CASE WHEN tx_type IN ('expense', 'restock') THEN total_amount_idr ELSE 0 END), 0)::BIGINT AS expense_idr,
  COALESCE(SUM(CASE WHEN tx_type = 'restock' THEN total_amount_idr ELSE 0 END), 0)::BIGINT AS restock_total_idr,
  COALESCE(SUM(CASE WHEN tx_type = 'restock' AND is_ocr_verified = TRUE THEN total_amount_idr ELSE 0 END), 0)::BIGINT AS restock_verified_idr,
  COUNT(CASE WHEN tx_type = 'restock' THEN 1 END)::INT AS restock_count,
  COUNT(DISTINCT DATE(tx_date))::INT AS active_days_count,
  COUNT(*)::INT AS total_tx_count,
  MIN(tx_date) AS first_tx_date
FROM effective_transactions
WHERE sme_id = $1 AND tx_date >= $2 AND tx_date <= $3;
