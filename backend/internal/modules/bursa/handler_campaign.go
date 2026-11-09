package bursa

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/middleware"
)

func RegisterCampaignHandlers(api huma.API, svc *CampaignService, pool *pgxpool.Pool) {
	registerCreateCampaign(api, svc, pool)
	registerSubmitCampaign(api, svc, pool)
	registerCancelCampaign(api, svc, pool)
	registerListCampaigns(api, svc, pool)
}

func registerCreateCampaign(api huma.API, svc *CampaignService, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "campaignCreate",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/campaigns",
		Summary:     "Create a draft campaign for an SME",
		Tags:        []string{"Campaigns"},
	}, func(ctx context.Context, in *struct {
		SMEID string            `path:"sme_id"`
		Body  CreateCampaignReq `json:"body"`
	}) (*struct{ Body *CampaignDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		res, err := svc.CreateCampaign(ctx, smeUUID, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *CampaignDTO }{Body: res}, nil
	})
}

func registerSubmitCampaign(api huma.API, svc *CampaignService, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "campaignSubmit",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/campaigns/{id}/submit",
		Summary:     "Submit a campaign for review",
		Tags:        []string{"Campaigns"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		ID    string `path:"id"`
	}) (*struct{ Body *CampaignDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		campUUID, err := resolveCampaignUUID(ctx, svc.q, in.ID)
		if err != nil {
			return nil, err
		}
		res, err := svc.SubmitCampaign(ctx, smeUUID, campUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *CampaignDTO }{Body: res}, nil
	})
}

func registerCancelCampaign(api huma.API, svc *CampaignService, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "campaignCancel",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/campaigns/{id}/cancel",
		Summary:     "Cancel a campaign",
		Tags:        []string{"Campaigns"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		ID    string `path:"id"`
	}) (*struct{ Body *CampaignDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		campUUID, err := resolveCampaignUUID(ctx, svc.q, in.ID)
		if err != nil {
			return nil, err
		}
		res, err := svc.CancelCampaign(ctx, smeUUID, campUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *CampaignDTO }{Body: res}, nil
	})
}

func registerListCampaigns(api huma.API, svc *CampaignService, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "campaignListBySME",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/campaigns",
		Summary:     "List campaigns owned by an SME",
		Tags:        []string{"Campaigns"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
	}) (*struct{ Body []CampaignDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		list, err := svc.ListCampaignsBySME(ctx, smeUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []CampaignDTO }{Body: list}, nil
	})
}
