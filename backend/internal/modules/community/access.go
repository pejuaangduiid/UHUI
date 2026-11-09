package community

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db/gen"
)

func CanAccessBoardroom(ctx context.Context, q *gen.Queries, smeID, userID uuid.UUID) (bool, error) {
	hasAccess, err := q.CheckBoardroomAccess(ctx, gen.CheckBoardroomAccessParams{
		ID:      pgtype.UUID{Bytes: smeID, Valid: true},
		OwnerID: pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return false, err
	}
	return hasAccess.Valid && hasAccess.Bool, nil
}
