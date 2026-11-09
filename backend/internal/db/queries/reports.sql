-- name: InsertSnapshot :one
INSERT INTO report_snapshots (
  sme_id, doc_type, period_start, period_end, payload_json, sha256
) VALUES (
  $1, $2, $3, $4, $5, $6
) ON CONFLICT (sha256) DO NOTHING
RETURNING *;

-- name: GetSnapshotByHash :one
SELECT id, sme_id, doc_type, period_start, period_end, payload_json, sha256, created_at
FROM report_snapshots
WHERE sha256 = $1;

-- name: GetSnapshotByPeriod :one
SELECT id, sme_id, doc_type, period_start, period_end, payload_json, sha256, created_at
FROM report_snapshots
WHERE sme_id = $1 AND doc_type = $2 AND period_start = $3 AND period_end = $4
LIMIT 1;

-- name: GetSMEVerificationDetails :one
SELECT s.id, s.business_name, s.slug, s.sector, s.verify_show_figures, s.is_incorporated_pt, s.created_at
FROM smes s
WHERE s.id = $1;

-- name: GetPeriodFinancials :one
SELECT
  COALESCE(SUM(CASE WHEN tx_type = 'sale' THEN total_amount_idr ELSE 0 END), 0)::BIGINT AS revenue_idr,
  COALESCE(SUM(CASE WHEN tx_type = 'restock' THEN total_amount_idr ELSE 0 END), 0)::BIGINT AS restock_expense_idr,
  COALESCE(SUM(CASE WHEN tx_type = 'expense' THEN total_amount_idr ELSE 0 END), 0)::BIGINT AS operational_expense_idr,
  COUNT(id)::BIGINT AS tx_count,
  COUNT(DISTINCT tx_date)::INTEGER AS active_days
FROM effective_transactions
WHERE sme_id = $1 AND tx_date BETWEEN $2 AND $3;

-- name: GetTotalInventoryCost :one
SELECT
  COALESCE(SUM(stock_qty::BIGINT * unit_cost_idr), 0)::BIGINT AS total_inventory_cost_idr
FROM inventory_items
WHERE sme_id = $1;

-- name: GetCumulativeCashBalance :one
SELECT
  (COALESCE(SUM(CASE WHEN tx_type = 'sale' THEN total_amount_idr ELSE 0 END), 0) -
   COALESCE(SUM(CASE WHEN tx_type IN ('restock', 'expense') THEN total_amount_idr ELSE 0 END), 0))::BIGINT AS cash_balance_idr
FROM effective_transactions
WHERE sme_id = $1 AND tx_date <= $2;

-- name: UpdateVerifyShowFigures :one
UPDATE smes SET
  verify_show_figures = $2,
  updated_at = NOW()
WHERE id = $1
RETURNING id, verify_show_figures;

-- name: ListSnapshotsBySME :many
SELECT id, sme_id, doc_type, period_start, period_end, payload_json, sha256, created_at
FROM report_snapshots
WHERE sme_id = $1
ORDER BY created_at DESC;

