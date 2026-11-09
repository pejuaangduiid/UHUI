-- name: ListCourses :many
SELECT c.*,
  (SELECT COUNT(1) FROM course_lessons cl WHERE cl.course_id = c.id) as lesson_count,
  (SELECT COUNT(1) FROM course_enrollments ce WHERE ce.course_id = c.id) as student_count
FROM courses c
WHERE c.is_published = true
ORDER BY c.created_at ASC;

-- name: GetCourseBySlug :one
SELECT c.*,
  (SELECT COUNT(1) FROM course_lessons cl WHERE cl.course_id = c.id) as lesson_count,
  (SELECT COUNT(1) FROM course_enrollments ce WHERE ce.course_id = c.id) as student_count
FROM courses c
WHERE c.slug = $1 AND c.is_published = true;

-- name: GetCourseByID :one
SELECT * FROM courses
WHERE id = $1;

-- name: ListLessonsByCourseID :many
SELECT * FROM course_lessons
WHERE course_id = $1
ORDER BY sort_order ASC;

-- name: GetCourseEnrollment :one
SELECT * FROM course_enrollments
WHERE course_id = $1 AND user_id = $2;

-- name: CreateCourseEnrollment :one
INSERT INTO course_enrollments (
  course_id, user_id, amount_paid_idr, progress_percent
) VALUES (
  $1, $2, $3, $4
) RETURNING *;

-- name: ListWebinars :many
SELECT w.*,
  c.title as related_course_title,
  c.slug as related_course_slug,
  (SELECT COUNT(1) FROM webinar_registrations wr WHERE wr.webinar_id = w.id) as registration_count
FROM webinars w
LEFT JOIN courses c ON w.related_course_id = c.id
ORDER BY w.scheduled_at ASC;

-- name: GetWebinarByID :one
SELECT * FROM webinars
WHERE id = $1;

-- name: HasWebinarRegistration :one
SELECT EXISTS (
  SELECT 1 FROM webinar_registrations
  WHERE webinar_id = $1 AND user_id = $2
) as is_registered;

-- name: CreateWebinarRegistration :one
INSERT INTO webinar_registrations (
  webinar_id, user_id
) VALUES (
  $1, $2
) RETURNING *;

