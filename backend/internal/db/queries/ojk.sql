-- name: ListSCFPartners :many
SELECT * FROM ojk_licensed_entities
WHERE is_active = true AND entity_type = 'securities_crowdfunding'
ORDER BY brand_name ASC;

-- name: SearchLicensedEntities :many
SELECT * FROM ojk_licensed_entities
WHERE is_active = true
  AND (brand_name ILIKE '%' || $1 || '%' OR entity_name ILIKE '%' || $1 || '%')
ORDER BY brand_name ASC
LIMIT 15;

-- name: SearchIllegalEntities :many
SELECT * FROM ojk_illegal_entities
WHERE entity_name ILIKE '%' || $1 || '%'
   OR $1 = ANY(entity_aliases)
ORDER BY entity_name ASC
LIMIT 15;

-- name: UpsertLicensedEntity :one
INSERT INTO ojk_licensed_entities (
  entity_name, brand_name, license_number, entity_type, website_url, is_active, last_synced_at
) VALUES (
  $1, $2, $3, $4, $5, $6, NOW()
)
ON CONFLICT (brand_name, entity_type) DO UPDATE SET
  entity_name = EXCLUDED.entity_name,
  license_number = COALESCE(EXCLUDED.license_number, ojk_licensed_entities.license_number),
  website_url = COALESCE(EXCLUDED.website_url, ojk_licensed_entities.website_url),
  is_active = EXCLUDED.is_active,
  last_synced_at = NOW()
RETURNING *;

-- name: UpsertIllegalEntity :one
INSERT INTO ojk_illegal_entities (
  entity_name, entity_aliases, activity_type, suspicion_notes, last_synced_at
) VALUES (
  $1, $2, $3, $4, NOW()
)
ON CONFLICT (entity_name) DO UPDATE SET
  entity_aliases = EXCLUDED.entity_aliases,
  activity_type = EXCLUDED.activity_type,
  suspicion_notes = EXCLUDED.suspicion_notes,
  last_synced_at = NOW()
RETURNING *;

-- name: CheckEntityIllegalMatch :many
SELECT * FROM ojk_illegal_entities
WHERE entity_name ILIKE '%' || $1 || '%'
   OR $1 = ANY(entity_aliases)
LIMIT 5;

-- name: GetSCFPartnerByID :one
SELECT * FROM ojk_licensed_entities
WHERE id = $1;

