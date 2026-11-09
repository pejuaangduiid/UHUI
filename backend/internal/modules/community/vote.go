package community

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

type VoteResult struct {
	UpvotesCount int32 `json:"upvotes_count"`
	HasVoted     bool  `json:"has_voted"`
}

func ToggleVote(ctx context.Context, pool *pgxpool.Pool, q *gen.Queries, threadID, userID uuid.UUID) (*VoteResult, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memulai transaksi: " + err.Error())
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := q.WithTx(tx)

	tUUID := pgtype.UUID{Bytes: threadID, Valid: true}
	uUUID := pgtype.UUID{Bytes: userID, Valid: true}

	voted, err := qtx.HasUserVoted(ctx, gen.HasUserVotedParams{ThreadID: tUUID, UserID: uUUID})
	if err != nil {
		return nil, apperr.Internal("Gagal memeriksa status vote: " + err.Error())
	}

	var newCount int32
	if voted {
		_ = qtx.DeleteVote(ctx, gen.DeleteVoteParams{ThreadID: tUUID, UserID: uUUID})
		newCount, err = qtx.DecrementThreadUpvotes(ctx, tUUID)
	} else {
		_, _ = qtx.InsertVote(ctx, gen.InsertVoteParams{ThreadID: tUUID, UserID: uUUID})
		newCount, err = qtx.IncrementThreadUpvotes(ctx, tUUID)
	}

	if err != nil {
		return nil, apperr.Internal("Gagal memperbarui jumlah vote: " + err.Error())
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Internal("Gagal menyimpan vote: " + err.Error())
	}

	return &VoteResult{
		UpvotesCount: newCount,
		HasVoted:     !voted,
	}, nil
}
