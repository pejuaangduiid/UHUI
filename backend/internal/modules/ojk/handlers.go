package ojk

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/middleware"
)

func RegisterHandlers(api huma.API, svc *Service, pool *pgxpool.Pool) {
	registerGetSCFPartners(api, svc)
	registerCheckEntity(api, svc)
	registerScreenSME(api, svc)
	registerSyncUpstream(api, svc)
}

func registerGetSCFPartners(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "ojkGetSCFPartners",
		Method:      http.MethodGet,
		Path:        "/api/v1/ojk/scf-partners",
		Summary:     "Get official OJK licensed Securities Crowdfunding partners",
		Tags:        []string{"OJK"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []SCFPartnerDTO }, error) {
		res, err := svc.GetSCFPartners(ctx)
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, err.Error())
		}
		return &struct{ Body []SCFPartnerDTO }{Body: res}, nil
	})
}

func registerCheckEntity(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "ojkCheckEntity",
		Method:      http.MethodGet,
		Path:        "/api/v1/ojk/check",
		Summary:     "Check entity legality against OJK registered & illegal entities",
		Tags:        []string{"OJK"},
	}, func(ctx context.Context, in *struct {
		Query string `query:"query" doc:"Keyword, brand, or platform name to check"`
	}) (*struct{ Body *OJKCheckResultDTO }, error) {
		res, err := svc.CheckEntity(ctx, in.Query)
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, err.Error())
		}
		return &struct{ Body *OJKCheckResultDTO }{Body: res}, nil
	})
}

func registerScreenSME(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "ojkScreenSME",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/smes/{id}/ojk-screening",
		Summary:     "Audit and screen SME against OJK illegal entity blacklist",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct{ Body *SMEScreeningResultDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin", "analyst"); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Format SME ID tidak valid")
		}
		res, err := svc.ScreenSME(ctx, smeUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *SMEScreeningResultDTO }{Body: res}, nil
	})
}

func registerSyncUpstream(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "ojkSyncUpstream",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/ojk/sync",
		Summary:     "Trigger sync of OJK registered apps and illegal entities from upstream",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body *SyncResultDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		res, err := svc.SyncFromUpstream(ctx)
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, err.Error())
		}
		return &struct{ Body *SyncResultDTO }{Body: res}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
