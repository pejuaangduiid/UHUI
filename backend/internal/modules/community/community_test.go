package community_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/modules/community"
)

func TestCommunity_PublicHubThreadAndComment(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := community.NewService(pool, q)

	authorID := createTestUser(t, pool, "mentor")

	th, err := svc.CreateHubThread(ctx, authorID, "discussion", "Strategi Efisiensi HPP", "Berikut beberapa tips...", nil)
	if err != nil {
		t.Fatalf("create hub thread failed: %v", err)
	}
	if th.Visibility != "public_hub" {
		t.Fatalf("expected public_hub visibility, got %s", th.Visibility)
	}

	thUUID, _ := uuid.Parse(th.ID)
	cmt, err := svc.CreateComment(ctx, thUUID, authorID, "Sangat bermanfaat!")
	if err != nil {
		t.Fatalf("create comment failed: %v", err)
	}
	if cmt.Content != "Sangat bermanfaat!" {
		t.Fatalf("unexpected comment content: %s", cmt.Content)
	}

	cmts, err := svc.ListComments(ctx, thUUID, &authorID)
	if err != nil || len(cmts) == 0 {
		t.Fatalf("expected at least 1 comment, got %d", len(cmts))
	}
}

func TestCommunity_BoardroomAccessControl(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := community.NewService(pool, q)

	smeID, ownerID := createTestSME(t, pool)
	investorID := createConfirmedInvestor(t, pool, smeID)
	outsiderID := createTestUser(t, pool, "investor")

	th, err := svc.CreateBoardroomThread(ctx, smeID, ownerID, "discussion", "Laporan Q3", "Perkembangan kuartal 3...", nil)
	if err != nil {
		t.Fatalf("owner failed to create boardroom thread: %v", err)
	}

	thUUID, _ := uuid.Parse(th.ID)
	readThread, err := svc.GetThread(ctx, thUUID, &investorID)
	if err != nil || readThread == nil {
		t.Fatalf("confirmed investor failed to read boardroom thread: %v", err)
	}

	_, err = svc.GetThread(ctx, thUUID, &outsiderID)
	if err == nil {
		t.Fatal("expected error for outsider accessing boardroom, got nil")
	}

	_, err = svc.ListBoardroomThreads(ctx, smeID, outsiderID, 10)
	if err == nil {
		t.Fatal("expected error for outsider listing boardroom threads, got nil")
	}
}

func TestCommunity_VoteToggling(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)
	q := gen.New(pool)
	svc := community.NewService(pool, q)

	user1 := createTestUser(t, pool, "investor")
	th, err := svc.CreateHubThread(ctx, user1, "discussion", "Voting Thread", "Isi konten", nil)
	if err != nil {
		t.Fatalf("create thread failed: %v", err)
	}

	thUUID, _ := uuid.Parse(th.ID)

	res1, err := community.ToggleVote(ctx, pool, q, thUUID, user1)
	if err != nil {
		t.Fatalf("first vote toggle failed: %v", err)
	}
	if !res1.HasVoted || res1.UpvotesCount != 1 {
		t.Fatalf("expected hasVoted=true, count=1, got %v, %d", res1.HasVoted, res1.UpvotesCount)
	}

	res2, err := community.ToggleVote(ctx, pool, q, thUUID, user1)
	if err != nil {
		t.Fatalf("second vote toggle failed: %v", err)
	}
	if res2.HasVoted || res2.UpvotesCount != 0 {
		t.Fatalf("expected hasVoted=false, count=0, got %v, %d", res2.HasVoted, res2.UpvotesCount)
	}
}

func TestCommunity_DbConstraints(t *testing.T) {
	ctx := context.Background()
	pool := db.OpenTestPool(t)

	authorID := createTestUser(t, pool, "sme_owner")

	smeID, _ := createTestSME(t, pool)
	_, err := pool.Exec(ctx, `
		INSERT INTO community_threads (
			sme_id, author_id, visibility, kind, title, content, shared_metrics_json
		) VALUES (
			$1, $2, 'private_boardroom', 'discussion', 'Test Title', 'Test Content', '{"rev": 100}'::jsonb
		)
	`, smeID, authorID)
	if err == nil {
		t.Fatal("expected DB constraint error when attaching shared_metrics_json to private_boardroom, got nil")
	}
}

func createTestSME(t *testing.T, pool *pgxpool.Pool) (smeID, ownerID uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	ownerID = createTestUser(t, pool, "sme_owner")

	var smeIDStr string
	err := pool.QueryRow(ctx, `
		INSERT INTO smes (owner_id, business_name, slug, sector, is_incorporated_pt, ai_interval, next_ai_analysis_at)
		VALUES ($1, 'Kopi Bersama', 'kopi-' || gen_random_uuid(), 'Kuliner', false, 'disabled', NULL)
		RETURNING id::text
	`, ownerID).Scan(&smeIDStr)
	if err != nil {
		t.Fatalf("failed to insert test SME: %v", err)
	}
	smeID, _ = uuid.Parse(smeIDStr)
	return smeID, ownerID
}

func createTestUser(t *testing.T, pool *pgxpool.Pool, role string) uuid.UUID {
	t.Helper()
	ctx := context.Background()
	var userIDStr string
	err := pool.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
		VALUES ('user-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Community Tester', $1, NOW())
		RETURNING id::text
	`, role).Scan(&userIDStr)
	if err != nil {
		t.Fatalf("failed to insert test user: %v", err)
	}
	id, _ := uuid.Parse(userIDStr)
	return id
}

func createConfirmedInvestor(t *testing.T, pool *pgxpool.Pool, smeID uuid.UUID) uuid.UUID {
	t.Helper()
	ctx := context.Background()
	investorID := createTestUser(t, pool, "investor")

	var campIDStr string
	slug := "camp-comm-" + uuid.NewString()[:8]
	err := pool.QueryRow(ctx, `
		INSERT INTO bursa_campaigns (
			sme_id, slug, title, scheme, target_amount_idr,
			min_investment_idr, return_share_bps, term_months, status, closes_at
		) VALUES (
			$1, $2, 'Kampanye Terbuka', 'revenue_sharing', 5000000,
			500000, 1500, 12, 'open', NOW() + INTERVAL '30 days'
		) RETURNING id::text
	`, smeID, slug).Scan(&campIDStr)
	if err != nil {
		t.Fatalf("failed to insert campaign: %v", err)
	}
	campID, _ := uuid.Parse(campIDStr)

	_, err = pool.Exec(ctx, `
		INSERT INTO investments (
			campaign_id, investor_id, amount_idr, status, idempotency_key, request_hash
		) VALUES (
			$1, $2, 1000000, 'confirmed', $3, '\x1234'::bytea
		)
	`, campID, investorID, uuid.NewString())
	if err != nil {
		t.Fatalf("failed to insert confirmed investment: %v", err)
	}

	return investorID
}
