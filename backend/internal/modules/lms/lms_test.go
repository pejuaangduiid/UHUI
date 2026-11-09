package lms_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/modules/lms"
)

func createTestUser(t *testing.T, pool *pgxpool.Pool) uuid.UUID {
	t.Helper()
	var userID uuid.UUID
	err := pool.QueryRow(context.Background(), `
		INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
		VALUES ($1, 'hash', 'Test User', 'sme_owner', NOW())
		RETURNING id
	`, "user-"+uuid.New().String()[:8]+"@test.local").Scan(&userID)
	if err != nil {
		t.Fatalf("failed to insert test user: %v", err)
	}
	return userID
}

func TestLMS_ListCoursesAndDetail(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := lms.NewService(q)

	courses, err := svc.ListCourses(ctx, nil)
	if err != nil {
		t.Fatalf("ListCourses failed: %v", err)
	}
	if len(courses) == 0 {
		t.Fatalf("expected seeded courses, got 0")
	}

	detail, err := svc.GetCourseBySlug(ctx, courses[0].Slug, nil)
	if err != nil {
		t.Fatalf("GetCourseBySlug failed: %v", err)
	}
	if detail.Slug != courses[0].Slug {
		t.Fatalf("expected slug %s, got %s", courses[0].Slug, detail.Slug)
	}
}

func TestLMS_EnrollCourse(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := lms.NewService(q)

	courses, err := svc.ListCourses(ctx, nil)
	if err != nil || len(courses) == 0 {
		t.Fatalf("no courses available: %v", err)
	}

	courseUUID, _ := uuid.Parse(courses[0].ID)
	userUUID := createTestUser(t, pool)

	res, err := svc.Enroll(ctx, courseUUID, userUUID)
	if err != nil {
		t.Fatalf("enroll failed: %v", err)
	}
	if res.Status != "enrolled" {
		t.Fatalf("expected enrolled status, got %s", res.Status)
	}

	res2, err := svc.Enroll(ctx, courseUUID, userUUID)
	if err != nil {
		t.Fatalf("second enroll failed: %v", err)
	}
	if res2.Status != "already_enrolled" {
		t.Fatalf("expected already_enrolled, got %s", res2.Status)
	}
}

func TestLMS_WebinarRegistration(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := lms.NewService(q)

	webinars, err := svc.ListWebinars(ctx, nil)
	if err != nil {
		t.Fatalf("ListWebinars failed: %v", err)
	}
	if len(webinars) == 0 {
		t.Fatalf("expected seeded webinars, got 0")
	}

	webinarUUID, _ := uuid.Parse(webinars[0].ID)
	userUUID := createTestUser(t, pool)

	err = svc.RegisterWebinar(ctx, webinarUUID, userUUID)
	if err != nil {
		t.Fatalf("register webinar failed: %v", err)
	}
}
