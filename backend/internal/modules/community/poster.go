package community

import (
	"context"

	"github.com/google/uuid"
)

type Poster interface {
	PostToPublicHub(ctx context.Context, authorID uuid.UUID, title, content string, metricsJSON []byte) (*ThreadDTO, error)
	PostToBoardroom(ctx context.Context, smeID, authorID uuid.UUID, title, content string, aiReportID *uuid.UUID) (*ThreadDTO, error)
}
