-- name: ListReviewQueue :many
SELECT d.id, d.sme_id, d.doc_type, d.storage_key, d.status, d.review_note, d.reviewed_by, d.reviewed_at, d.created_at, s.business_name
FROM sme_documents d
JOIN smes s ON d.sme_id = s.id
ORDER BY CASE WHEN d.status = 'pending' THEN 0 ELSE 1 END, d.created_at DESC;

-- name: ReviewDocument :one
UPDATE sme_documents
SET status = $2,
    review_note = $3,
    reviewed_by = $4,
    reviewed_at = NOW()
WHERE id = $1
RETURNING id, sme_id, doc_type, storage_key, status, review_note, reviewed_by, reviewed_at, created_at;

-- name: GetDocumentByID :one
SELECT d.id, d.sme_id, d.doc_type, d.storage_key, d.status, d.review_note, d.reviewed_by, d.reviewed_at, d.created_at, s.business_name
FROM sme_documents d
JOIN smes s ON d.sme_id = s.id
WHERE d.id = $1;

