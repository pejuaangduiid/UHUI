-- name: CreateThread :one
INSERT INTO community_threads (
  sme_id, author_id, visibility, kind, title, content, shared_metrics_json, attached_ai_report_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;

-- name: GetThreadByID :one
SELECT t.*, u.full_name as author_name, u.role as author_role,
       cg.name as group_name, cg.slug as group_slug
FROM community_threads t
JOIN users u ON t.author_id = u.id
LEFT JOIN community_groups cg ON t.group_id = cg.id
WHERE t.id = $1;

-- name: ListPublicHubThreads :many
SELECT t.*, u.full_name as author_name, u.role as author_role,
       (SELECT COUNT(1) FROM community_comments c WHERE c.thread_id = t.id) as comment_count,
       cg.name as group_name, cg.slug as group_slug
FROM community_threads t
JOIN users u ON t.author_id = u.id
LEFT JOIN community_groups cg ON t.group_id = cg.id
WHERE t.visibility = 'public_hub'
ORDER BY t.created_at DESC
LIMIT $1;

-- name: ListBoardroomThreads :many
SELECT t.*, u.full_name as author_name, u.role as author_role,
       (SELECT COUNT(1) FROM community_comments c WHERE c.thread_id = t.id) as comment_count
FROM community_threads t
JOIN users u ON t.author_id = u.id
WHERE t.visibility = 'private_boardroom' AND t.sme_id = $1
ORDER BY t.created_at DESC
LIMIT $2;

-- name: ListGroupThreads :many
SELECT t.*, u.full_name as author_name, u.role as author_role,
       (SELECT COUNT(1) FROM community_comments c WHERE c.thread_id = t.id) as comment_count,
       cg.name as group_name, cg.slug as group_slug
FROM community_threads t
JOIN users u ON t.author_id = u.id
LEFT JOIN community_groups cg ON t.group_id = cg.id
WHERE t.group_id = $1
ORDER BY t.created_at DESC
LIMIT $2;

-- name: ListUserThreads :many
SELECT t.*, u.full_name as author_name, u.role as author_role,
       (SELECT COUNT(1) FROM community_comments c WHERE c.thread_id = t.id) as comment_count,
       cg.name as group_name, cg.slug as group_slug
FROM community_threads t
JOIN users u ON t.author_id = u.id
LEFT JOIN community_groups cg ON t.group_id = cg.id
WHERE t.author_id = $1
ORDER BY t.created_at DESC
LIMIT $2;

-- name: UpdateThread :one
UPDATE community_threads
SET title = $2, content = $3, kind = $4
WHERE id = $1 AND author_id = $5
RETURNING *;

-- name: DeleteThread :exec
DELETE FROM community_threads
WHERE id = $1 AND author_id = $2;

-- name: CreateThreadWithGroup :one
INSERT INTO community_threads (
  sme_id, author_id, visibility, kind, title, content, shared_metrics_json, attached_ai_report_id, group_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: CreateComment :one
INSERT INTO community_comments (
  thread_id, author_id, content
) VALUES (
  $1, $2, $3
) RETURNING *;

-- name: ListCommentsByThread :many
SELECT c.*, u.full_name as author_name, u.role as author_role
FROM community_comments c
JOIN users u ON c.author_id = u.id
WHERE c.thread_id = $1
ORDER BY c.created_at ASC;

-- name: HasUserVoted :one
SELECT EXISTS (
  SELECT 1 FROM community_votes
  WHERE thread_id = $1 AND user_id = $2
) as voted;

-- name: InsertVote :one
INSERT INTO community_votes (
  thread_id, user_id
) VALUES (
  $1, $2
) ON CONFLICT DO NOTHING
RETURNING *;

-- name: DeleteVote :exec
DELETE FROM community_votes
WHERE thread_id = $1 AND user_id = $2;

-- name: IncrementThreadUpvotes :one
UPDATE community_threads
SET upvotes_count = upvotes_count + 1
WHERE id = $1
RETURNING upvotes_count;

-- name: DecrementThreadUpvotes :one
UPDATE community_threads
SET upvotes_count = GREATEST(upvotes_count - 1, 0)
WHERE id = $1
RETURNING upvotes_count;

-- name: CheckBoardroomAccess :one
SELECT (
  EXISTS (
    SELECT 1 FROM smes s
    WHERE s.id = $1 AND s.owner_id = $2
  )
  OR
  EXISTS (
    SELECT 1 FROM investments i
    JOIN bursa_campaigns c ON i.campaign_id = c.id
    WHERE c.sme_id = $1 AND i.investor_id = $2 AND i.status = 'confirmed'
  )
) as has_access;
