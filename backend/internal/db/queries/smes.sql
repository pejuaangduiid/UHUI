-- name: CreateSME :one
INSERT INTO smes (owner_id, business_name, slug, sector, description, is_incorporated_pt, ai_interval, next_ai_analysis_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetSMEByOwnerID :one
SELECT *
FROM smes
WHERE owner_id = $1
ORDER BY created_at DESC
LIMIT 1;

-- name: ListSMEsByOwnerID :many
SELECT *
FROM smes
WHERE owner_id = $1
ORDER BY created_at DESC;

-- name: GetSMEByID :one
SELECT *
FROM smes
WHERE id = $1;

-- name: GetSMEBySlug :one
SELECT *
FROM smes
WHERE slug = $1;

-- name: UpdateSMEProfile :one
UPDATE smes
SET business_name = $2,
    sector = $3,
    description = $4,
    is_incorporated_pt = $5,
    verify_show_figures = $6,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetSMEDocuments :many
SELECT id, sme_id, doc_type, storage_key, status, review_note, reviewed_by, reviewed_at, created_at
FROM sme_documents
WHERE sme_id = $1
ORDER BY created_at ASC;

-- name: GetSMEDocumentByType :one
SELECT id, sme_id, doc_type, storage_key, status, review_note, reviewed_by, reviewed_at, created_at
FROM sme_documents
WHERE sme_id = $1 AND doc_type = $2;

-- name: UpsertSMEDocument :one
INSERT INTO sme_documents (sme_id, doc_type, storage_key, status)
VALUES ($1, $2, $3, 'pending')
ON CONFLICT (sme_id, doc_type)
DO UPDATE SET
  storage_key = EXCLUDED.storage_key,
  status = 'pending',
  review_note = NULL,
  reviewed_by = NULL,
  reviewed_at = NULL,
  created_at = NOW()
RETURNING id, sme_id, doc_type, storage_key, status, review_note, reviewed_by, reviewed_at, created_at;
