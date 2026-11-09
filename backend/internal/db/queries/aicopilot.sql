-- name: ClaimDueSMEs :many
UPDATE smes SET ai_claimed_at = NOW()
WHERE id IN (
  SELECT id FROM smes
  WHERE ai_interval <> 'disabled' AND next_ai_analysis_at <= NOW()
    AND (ai_claimed_at IS NULL OR ai_claimed_at < NOW() - INTERVAL '30 minutes')
  ORDER BY next_ai_analysis_at LIMIT 50
  FOR UPDATE SKIP LOCKED)
RETURNING id, ai_interval;

-- name: MarkAnalysisSuccess :exec
UPDATE smes SET
  next_ai_analysis_at = CASE
    WHEN ai_interval = '14_days' THEN NOW() + INTERVAL '14 days'
    WHEN ai_interval = '28_days' THEN NOW() + INTERVAL '28 days'
    ELSE NULL
  END,
  ai_claimed_at = NULL,
  updated_at = NOW()
WHERE id = $1;

-- name: MarkAnalysisFailure :exec
UPDATE smes SET
  ai_claimed_at = NULL,
  updated_at = NOW()
WHERE id = $1;

-- name: InsertDiagnosticReport :one
INSERT INTO ai_diagnostic_reports (
  sme_id, period_days, health_score, summary_text, anomalies_json, action_items_json, model_name
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: ListDiagnosticReports :many
SELECT * FROM ai_diagnostic_reports
WHERE sme_id = $1
ORDER BY generated_at DESC
LIMIT $2;

-- name: GetLatestDiagnosticReport :one
SELECT * FROM ai_diagnostic_reports
WHERE sme_id = $1
ORDER BY generated_at DESC
LIMIT 1;

-- name: GetDiagnosticReportByID :one
SELECT * FROM ai_diagnostic_reports
WHERE id = $1 AND sme_id = $2;

-- name: UpdateReportActionItems :one
UPDATE ai_diagnostic_reports SET
  action_items_json = $3
WHERE id = $1 AND sme_id = $2
RETURNING *;

-- name: UpdateAISettings :one
UPDATE smes SET
  ai_interval = $2,
  next_ai_analysis_at = CASE
    WHEN $2 = '14_days'::ai_schedule_interval THEN NOW() + INTERVAL '14 days'
    WHEN $2 = '28_days'::ai_schedule_interval THEN NOW() + INTERVAL '28 days'
    ELSE NULL
  END,
  ai_claimed_at = NULL,
  updated_at = NOW()
WHERE id = $1
RETURNING id, ai_interval, next_ai_analysis_at;

-- name: FindDeadStockItems :many
SELECT ii.id, ii.sku, ii.name, ii.stock_qty, ii.unit_cost_idr
FROM inventory_items ii
WHERE ii.sme_id = $1 AND ii.stock_qty > 0
  AND NOT EXISTS (
    SELECT 1 FROM transaction_items ti
    JOIN effective_transactions et ON ti.tx_id = et.id
    WHERE ti.inventory_item_id = ii.id AND et.tx_type = 'sale'
      AND et.tx_date >= $2
  )
ORDER BY ii.stock_qty DESC
LIMIT 10;

-- name: FindRecentRestockPriceIncreases :many
SELECT ti.inventory_item_id, ii.name as item_name, ti.unit_price_idr as restock_price_idr, ii.unit_cost_idr as baseline_cost_idr
FROM transaction_items ti
JOIN effective_transactions et ON ti.tx_id = et.id
JOIN inventory_items ii ON ti.inventory_item_id = ii.id
WHERE et.sme_id = $1 AND et.tx_type = 'restock'
  AND et.tx_date >= $2
  AND ii.unit_cost_idr > 0
  AND ti.unit_price_idr > ii.unit_cost_idr
ORDER BY et.tx_date DESC
LIMIT 10;

