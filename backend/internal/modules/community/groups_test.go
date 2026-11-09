package community

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

func TestGroupPosting_MembershipGate(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)

	defer func() {
		_, _ = pool.Exec(ctx, "DELETE FROM community_groups WHERE slug LIKE 'group-test-%'")
		_, _ = pool.Exec(ctx, "DELETE FROM users WHERE email LIKE 'grp-%@test.id'")
	}()

	_, _ = pool.Exec(ctx, "DELETE FROM community_groups WHERE slug LIKE 'group-test-%'")
	_, _ = pool.Exec(ctx, "DELETE FROM users WHERE email LIKE 'grp-%@test.id'")

	user1ID := uuid.New()
	user2ID := uuid.New()

	for _, uid := range []uuid.UUID{user1ID, user2ID} {
		email := "grp-" + uid.String() + "@test.id"
		_, err := pool.Exec(ctx, `
			INSERT INTO users (id, email, password_hash, full_name, role, pdp_consent_at)
			VALUES ($1, $2, 'dummy_hash', 'Group Tester', 'investor', NOW())
		`, uid, email)
		if err != nil {
			t.Fatalf("failed to insert user: %v", err)
		}
	}

	slug := "group-test-" + uuid.NewString()[:8]
	cg, err := q.CreateCommunityGroup(ctx, gen.CreateCommunityGroupParams{
		Slug:        slug,
		Sector:      "Kuliner",
		Name:        "Komunitas Tes Kuliner",
		Description: "Grup pengujian",
		IconName:    "utensils",
	})
	if err != nil {
		t.Fatalf("failed to create group: %v", err)
	}

	groupIDStr := uuid.UUID(cg.ID.Bytes).String()

	pUser1 := &middleware.Principal{UserID: user1ID.String(), Role: "investor"}
	_, err = handleCreateGroupThread(ctx, q, groupIDStr, pUser1, CreateGroupThreadInput{
		Kind:    "discussion",
		Title:   "Postingan Non Member",
		Content: "Harusnya ditolak",
	})
	if err == nil {
		t.Fatal("expected error for non-member creating thread, got nil")
	}

	err = q.JoinCommunityGroup(ctx, gen.JoinCommunityGroupParams{
		GroupID: cg.ID,
		UserID:  pgtype.UUID{Bytes: user1ID, Valid: true},
	})
	if err != nil {
		t.Fatalf("failed to join group: %v", err)
	}

	th, err := handleCreateGroupThread(ctx, q, groupIDStr, pUser1, CreateGroupThreadInput{
		Kind:    "discussion",
		Title:   "Postingan Resmi Anggota",
		Content: "Harusnya sukses dibuat",
	})
	if err != nil {
		t.Fatalf("member failed to create group thread: %v", err)
	}
	if th.Title != "Postingan Resmi Anggota" {
		t.Fatalf("unexpected title: %s", th.Title)
	}

	threads, err := q.ListGroupThreads(ctx, gen.ListGroupThreadsParams{
		GroupID: cg.ID,
		Limit:   10,
	})
	if err != nil {
		t.Fatalf("failed to list group threads: %v", err)
	}
	if len(threads) != 1 {
		t.Fatalf("expected 1 thread in group, got %d", len(threads))
	}

	updatedTh, err := handleUpdateThread(ctx, q, th.ID, pUser1, UpdateThreadInput{
		Title:   "Postingan Telah Diedit",
		Content: "Konten yang sudah diperbarui",
		Kind:    "discussion",
	})
	if err != nil {
		t.Fatalf("failed to update thread: %v", err)
	}
	if updatedTh.Title != "Postingan Telah Diedit" {
		t.Fatalf("unexpected updated title: %s", updatedTh.Title)
	}

	myThreads, err := q.ListUserThreads(ctx, gen.ListUserThreadsParams{
		AuthorID: pgtype.UUID{Bytes: user1ID, Valid: true},
		Limit:    10,
	})
	if err != nil || len(myThreads) == 0 {
		t.Fatalf("expected at least 1 user thread, got %d (err: %v)", len(myThreads), err)
	}

	thUUID, _ := uuid.Parse(th.ID)
	err = q.DeleteThread(ctx, gen.DeleteThreadParams{
		ID:       pgtype.UUID{Bytes: thUUID, Valid: true},
		AuthorID: pgtype.UUID{Bytes: user1ID, Valid: true},
	})
	if err != nil {
		t.Fatalf("failed to delete thread: %v", err)
	}

	err = q.LeaveCommunityGroup(ctx, gen.LeaveCommunityGroupParams{
		GroupID: cg.ID,
		UserID:  pgtype.UUID{Bytes: user1ID, Valid: true},
	})
	if err != nil {
		t.Fatalf("failed to leave group: %v", err)
	}

	isMemberAfterLeave, err := q.IsUserInCommunityGroup(ctx, gen.IsUserInCommunityGroupParams{
		GroupID: cg.ID,
		UserID:  pgtype.UUID{Bytes: user1ID, Valid: true},
	})
	if err != nil || isMemberAfterLeave {
		t.Fatalf("expected user to no longer be member, got is_member=%v (err=%v)", isMemberAfterLeave, err)
	}
}
