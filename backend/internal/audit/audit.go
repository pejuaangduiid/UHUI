package audit

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
)

const (
	ActionLogin               = "login"
	ActionRoleChanged         = "role_changed"
	ActionDocumentReviewed    = "document_reviewed"
	ActionReadinessSubmitted  = "readiness_submitted"
	ActionCampaignApproved    = "campaign_approved"
	ActionCampaignRejected    = "campaign_rejected"
	ActionInvestmentCreated   = "investment_created"
	ActionDistributionCreated = "distribution_created"
	ActionTxReversed          = "tx_reversed"
)

type Event struct {
	Meta     map[string]any
	Action   string
	Entity   string
	ActorID  pgtype.UUID
	EntityID pgtype.UUID
}

func Record(ctx context.Context, dbtx db.DBTX, ev Event) (*gen.AuditLog, error) {
	metaBytes := []byte("{}")
	if len(ev.Meta) > 0 {
		b, err := json.Marshal(ev.Meta)
		if err != nil {
			return nil, fmt.Errorf("audit: marshal meta: %w", err)
		}
		metaBytes = b
	}

	queries := gen.New(dbtx)
	row, err := queries.RecordAudit(ctx, gen.RecordAuditParams{
		ActorID:  ev.ActorID,
		Action:   ev.Action,
		Entity:   ev.Entity,
		EntityID: ev.EntityID,
		Meta:     metaBytes,
	})
	if err != nil {
		return nil, fmt.Errorf("audit: record: %w", err)
	}

	return &row, nil
}
