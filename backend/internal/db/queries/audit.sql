-- name: RecordAudit :one
INSERT INTO audit_log (actor_id, action, entity, entity_id, meta)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, actor_id, action, entity, entity_id, meta, created_at;

