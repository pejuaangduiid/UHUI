-- name: GetLatestReadinessConfig :one
SELECT version, weights_json, min_listing_score, min_history_days, n_min_restock, created_at
FROM readiness_config
ORDER BY version DESC
LIMIT 1;

-- name: GetReadinessConfigByVersion :one
SELECT version, weights_json, min_listing_score, min_history_days, n_min_restock, created_at
FROM readiness_config
WHERE version = $1;

-- name: CreateReadinessScore :one
INSERT INTO readiness_scores (
  sme_id, scheme, scoring_version, period_start, period_end,
  component_a, component_b, component_c, component_d, total,
  gate_passed, gate_failures_json
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9, $10,
  $11, $12
) RETURNING id, sme_id, scheme, scoring_version, period_start, period_end,
  component_a, component_b, component_c, component_d, total,
  gate_passed, gate_failures_json, computed_at;

-- name: GetLatestReadinessScore :one
SELECT id, sme_id, scheme, scoring_version, period_start, period_end,
  component_a, component_b, component_c, component_d, total,
  gate_passed, gate_failures_json, computed_at
FROM readiness_scores
WHERE sme_id = $1 AND scheme = $2
ORDER BY computed_at DESC
LIMIT 1;

