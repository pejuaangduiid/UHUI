-- name: ListAllSMEsForAdmin :many
SELECT s.id, s.owner_id, s.business_name, s.slug, s.sector, s.description,
       s.is_incorporated_pt, s.digital_readiness_score, s.is_listed_on_bursa,
       s.is_suspended, s.suspension_reason, s.created_at,
       u.full_name as owner_name, u.email as owner_email
FROM smes s
JOIN users u ON s.owner_id = u.id
ORDER BY s.created_at DESC;

-- name: SetSMESuspension :one
UPDATE smes
SET is_suspended = $2, suspension_reason = $3, updated_at = NOW()
WHERE id = $1
RETURNING id, business_name, is_suspended, suspension_reason;

-- name: ListAllCampaignsForAdmin :many
SELECT c.id, c.sme_id, c.slug, c.title, c.scheme, c.target_amount_idr,
       c.raised_amount_idr, c.min_investment_idr, c.return_share_bps,
       c.term_months, c.status, c.is_suspended, c.suspension_reason,
       c.closes_at, c.created_at,
       s.business_name, s.sector,
       u.full_name as owner_name, u.email as owner_email
FROM bursa_campaigns c
JOIN smes s ON c.sme_id = s.id
JOIN users u ON s.owner_id = u.id
ORDER BY c.created_at DESC;

-- name: SetCampaignSuspension :one
UPDATE bursa_campaigns
SET is_suspended = $2, suspension_reason = $3
WHERE id = $1
RETURNING id, title, is_suspended, suspension_reason;

-- name: ListAllCoursesForAdmin :many
SELECT c.*,
  (SELECT COUNT(1) FROM course_lessons cl WHERE cl.course_id = c.id) as lesson_count,
  (SELECT COUNT(1) FROM course_enrollments ce WHERE ce.course_id = c.id) as student_count
FROM courses c
ORDER BY c.created_at DESC;

-- name: CreateCourseAdmin :one
INSERT INTO courses (slug, title, description, instructor_name, price_idr, level, is_published, thumbnail_url)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateCourseAdmin :one
UPDATE courses
SET title = $2, description = $3, instructor_name = $4, price_idr = $5,
    level = $6, is_published = $7, thumbnail_url = $8
WHERE id = $1
RETURNING *;

-- name: DeleteCourseAdmin :exec
DELETE FROM courses WHERE id = $1;

-- name: CreateLessonAdmin :one
INSERT INTO course_lessons (course_id, sort_order, title, duration_minutes, video_url, content_text)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateLessonAdmin :one
UPDATE course_lessons
SET title = $2, duration_minutes = $3, content_text = $4, sort_order = $5, video_url = $6
WHERE id = $1
RETURNING *;

-- name: DeleteLessonAdmin :exec
DELETE FROM course_lessons WHERE id = $1;

-- name: ListAllThreadsForAdmin :many
SELECT t.*, u.full_name as author_name, u.email as author_email, u.role as author_role,
       u.suspended_until as author_suspended_until,
       cg.name as group_name, cg.slug as group_slug,
       (SELECT COUNT(1) FROM community_comments c WHERE c.thread_id = t.id) as comment_count
FROM community_threads t
JOIN users u ON t.author_id = u.id
LEFT JOIN community_groups cg ON t.group_id = cg.id
ORDER BY t.created_at DESC
LIMIT $1;

-- name: AdminDeleteThread :one
UPDATE community_threads
SET is_deleted_by_admin = true, admin_delete_reason = $2, content = '[Konten telah dihapus oleh Admin]'
WHERE id = $1
RETURNING *;

-- name: AdminDeleteComment :one
UPDATE community_comments
SET is_deleted_by_admin = true, admin_delete_reason = $2, content = '[Komentar telah dihapus oleh Admin]'
WHERE id = $1
RETURNING *;

-- name: SuspendUser :one
UPDATE users
SET suspended_until = $2, suspension_reason = $3, updated_at = NOW()
WHERE id = $1
RETURNING id, email, full_name, role, suspended_until, suspension_reason;

-- name: UnsuspendUser :one
UPDATE users
SET suspended_until = NULL, suspension_reason = NULL, updated_at = NOW()
WHERE id = $1
RETURNING id, email, full_name, role, suspended_until, suspension_reason;

-- name: ListSuspendedUsers :many
SELECT id, email, full_name, role, suspended_until, suspension_reason, created_at
FROM users
WHERE suspended_until IS NOT NULL AND suspended_until > NOW()
ORDER BY suspended_until DESC;

-- name: GetAdminStats :one
SELECT
  (SELECT COUNT(1) FROM smes) as total_smes,
  (SELECT COUNT(1) FROM smes WHERE is_suspended = true) as suspended_smes,
  (SELECT COUNT(1) FROM bursa_campaigns) as total_campaigns,
  (SELECT COUNT(1) FROM bursa_campaigns WHERE is_suspended = true) as suspended_campaigns,
  (SELECT COUNT(1) FROM courses) as total_courses,
  (SELECT COUNT(1) FROM community_threads) as total_threads,
  (SELECT COUNT(1) FROM community_threads WHERE is_deleted_by_admin = true) as moderated_threads,
  (SELECT COUNT(1) FROM users WHERE suspended_until IS NOT NULL AND suspended_until > NOW()) as suspended_users;

