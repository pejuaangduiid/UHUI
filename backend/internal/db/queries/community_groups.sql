-- name: ListCommunityGroups :many
SELECT cg.*,
  (SELECT COUNT(1) FROM community_group_members cgm WHERE cgm.group_id = cg.id) as member_count
FROM community_groups cg
ORDER BY cg.created_at ASC;

-- name: GetCommunityGroupBySlug :one
SELECT cg.*,
  (SELECT COUNT(1) FROM community_group_members cgm WHERE cgm.group_id = cg.id) as member_count
FROM community_groups cg
WHERE cg.slug = $1;

-- name: IsUserInCommunityGroup :one
SELECT EXISTS (
  SELECT 1 FROM community_group_members
  WHERE group_id = $1 AND user_id = $2
) as is_member;

-- name: JoinCommunityGroup :exec
INSERT INTO community_group_members (
  group_id, user_id
) VALUES (
  $1, $2
) ON CONFLICT DO NOTHING;

-- name: LeaveCommunityGroup :exec
DELETE FROM community_group_members
WHERE group_id = $1 AND user_id = $2;

-- name: CreateCommunityGroup :one
INSERT INTO community_groups (
  slug, sector, name, description, icon_name
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING *;

