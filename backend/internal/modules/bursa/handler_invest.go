package bursa

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

func resolveCampaignUUID(ctx context.Context, q *gen.Queries, idOrSlug string) (uuid.UUID, error) {
	parsed, err := uuid.Parse(idOrSlug)
	if err == nil {
		return parsed, nil
	}
	campRow, err := q.GetCampaignBySlug(ctx, idOrSlug)
	if err != nil {
		return uuid.Nil, huma.NewError(http.StatusNotFound, "Kampanye tidak ditemukan")
	}
	return uuid.UUID(campRow.ID.Bytes), nil
}

func RegisterInvestHandlers(api huma.API, investSvc *InvestService, distSvc *DistributionService, pool *pgxpool.Pool, q *gen.Queries) {
	registerInvest(api, investSvc)
	registerPortfolio(api, investSvc)
	registerCreateDistribution(api, distSvc, pool, q)
	registerListDistributions(api, distSvc)
}

func registerInvest(api huma.API, svc *InvestService) {
	huma.Register(api, huma.Operation{
		OperationID: "campaignInvest",
		Method:      http.MethodPost,
		Path:        "/api/v1/campaigns/{id}/invest",
		Summary:     "Invest in an open campaign",
		Tags:        []string{"Investments"},
	}, func(ctx context.Context, in *struct {
		ID             string `path:"id"`
		IdempotencyKey string `header:"Idempotency-Key" doc:"Unique idempotency key"`
		Body           struct {
			AmountIDR int64 `json:"amount_idr"`
		}
	}) (*struct{ Body *InvestmentDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		if in.IdempotencyKey == "" {
			return nil, huma.NewError(http.StatusBadRequest, "Header Idempotency-Key wajib disertakan")
		}
		campUUID, err := resolveCampaignUUID(ctx, svc.q, in.ID)
		if err != nil {
			return nil, err
		}
		investorUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		rawJSON, _ := json.Marshal(in.Body)
		h := sha256.Sum256(rawJSON)

		res, err := svc.Invest(ctx, InvestParam{
			InvestorID:     investorUUID,
			CampaignID:     campUUID,
			IdempotencyKey: in.IdempotencyKey,
			RequestHash:    h[:],
			AmountIDR:      in.Body.AmountIDR,
		})
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *InvestmentDTO }{Body: res}, nil
	})
}

func registerPortfolio(api huma.API, svc *InvestService) {
	huma.Register(api, huma.Operation{
		OperationID: "mePortfolio",
		Method:      http.MethodGet,
		Path:        "/api/v1/me/portfolio",
		Summary:     "Get current investor portfolio",
		Tags:        []string{"Investments"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []PortfolioItemDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		investorUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}
		items, err := svc.ListInvestorPortfolio(ctx, investorUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []PortfolioItemDTO }{Body: items}, nil
	})
}

func registerCreateDistribution(api huma.API, svc *DistributionService, pool *pgxpool.Pool, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "campaignDistributeProfit",
		Method:      http.MethodPost,
		Path:        "/api/v1/campaigns/{id}/distributions",
		Summary:     "Execute profit distribution for a funded campaign",
		Tags:        []string{"Distributions"},
	}, func(ctx context.Context, in *struct {
		ID   string `path:"id"`
		Body struct {
			ReportSnapshotID *string   `json:"report_snapshot_id,omitempty"`
			PeriodStart      time.Time `json:"period_start"`
			PeriodEnd        time.Time `json:"period_end"`
			PoolIDR          int64     `json:"pool_idr"`
		}
	}) (*struct{ Body *ProfitDistributionDTO }, error) {
		campUUID, err := resolveCampaignUUID(ctx, svc.q, in.ID)
		if err != nil {
			return nil, err
		}
		camp, err := q.GetCampaignByID(ctx, pgtype.UUID{Bytes: campUUID, Valid: true})
		if err != nil {
			return nil, huma.NewError(http.StatusNotFound, "Kampanye tidak ditemukan")
		}
		smeIDStr := uuid.UUID(camp.SmeID.Bytes).String()
		if _, chkErr := middleware.CheckSMEOwner(ctx, pool, smeIDStr); chkErr != nil {
			return nil, mapAppError(chkErr)
		}

		var snapUUID *uuid.UUID
		if in.Body.ReportSnapshotID != nil {
			if parsed, parseErr := uuid.Parse(*in.Body.ReportSnapshotID); parseErr == nil {
				snapUUID = &parsed
			}
		}

		res, err := svc.DistributeProfit(ctx, DistributeProfitReq{
			CampaignID:       campUUID,
			ReportSnapshotID: snapUUID,
			PeriodStart:      in.Body.PeriodStart,
			PeriodEnd:        in.Body.PeriodEnd,
			PoolIDR:          in.Body.PoolIDR,
		})
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *ProfitDistributionDTO }{Body: res}, nil
	})
}

func registerListDistributions(api huma.API, svc *DistributionService) {
	huma.Register(api, huma.Operation{
		OperationID: "campaignListDistributions",
		Method:      http.MethodGet,
		Path:        "/api/v1/campaigns/{id}/distributions",
		Summary:     "List profit distribution history for a campaign",
		Tags:        []string{"Distributions"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct{ Body []ProfitDistributionDTO }, error) {
		campUUID, err := resolveCampaignUUID(ctx, svc.q, in.ID)
		if err != nil {
			return nil, err
		}
		items, err := svc.ListDistributions(ctx, campUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []ProfitDistributionDTO }{Body: items}, nil
	})
}
