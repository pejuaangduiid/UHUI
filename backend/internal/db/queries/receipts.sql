-- name: CreateReceiptScan :one
INSERT INTO receipt_scans (
  sme_id, user_id, object_key, sha256, proposal_json, ocr_total_idr, expires_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
) RETURNING id, sme_id, user_id, object_key, sha256, proposal_json, ocr_total_idr, expires_at, consumed_at, created_at;

-- name: GetReceiptScanByID :one
SELECT id, sme_id, user_id, object_key, sha256, proposal_json, ocr_total_idr, expires_at, consumed_at, created_at
FROM receipt_scans
WHERE id = $1 AND sme_id = $2;

-- name: CheckDuplicateProofHash :one
SELECT EXISTS(
  SELECT 1 FROM operational_transactions
  WHERE sme_id = $1 AND proof_sha256 = $2
) AS is_duplicate;

-- name: CheckDuplicateReceiptScanHash :one
SELECT EXISTS(
  SELECT 1 FROM receipt_scans
  WHERE sme_id = $1 AND sha256 = $2 AND expires_at > NOW()
) AS is_duplicate;

-- name: CheckSuspectDuplicate :one
SELECT EXISTS(
  SELECT 1 FROM operational_transactions
  WHERE sme_id = $1 AND total_amount_idr = $2 AND DATE(tx_date) = $3
) AS is_suspect;

-- name: LockReceiptScanForConsume :one
SELECT id, sme_id, user_id, object_key, sha256, proposal_json, ocr_total_idr, expires_at, consumed_at, created_at
FROM receipt_scans
WHERE id = $1 AND sme_id = $2 AND consumed_at IS NULL AND expires_at > NOW()
FOR UPDATE;

-- name: MarkReceiptScanConsumed :one
UPDATE receipt_scans
SET consumed_at = NOW()
WHERE id = $1
RETURNING id, sme_id, user_id, object_key, sha256, proposal_json, ocr_total_idr, expires_at, consumed_at, created_at;
