package admin

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/middleware"
)

func RegisterHandlers(api huma.API, svc *Service) {
	registerListQueue(api, svc)
	registerReviewDoc(api, svc)
	registerListCampaignQueue(api, svc)
	registerReviewCampaign(api, svc)
	RegisterModerationHandlers(api, svc)
}

func registerListQueue(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminListReviewQueue",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/review-queue",
		Summary:     "List pending documents in review queue",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []QueueItem }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin", "analyst"); err != nil {
			return nil, mapAppError(err)
		}

		items, err := svc.ListReviewQueue(ctx)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []QueueItem }{Body: items}, nil
	})
}

func registerReviewDoc(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminReviewDocument",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/documents/{id}/review",
		Summary:     "Approve or reject a document",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string `path:"id"`
		Body ReviewInput
	}) (*struct{ Body QueueItem }, error) {
		p, err := middleware.CheckRole(ctx, "superadmin", "admin", "analyst")
		if err != nil {
			return nil, mapAppError(err)
		}

		var docID, revID pgtype.UUID
		if scanErr := docID.Scan(in.ID); scanErr != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID dokumen tidak valid", "")
		}
		_ = revID.Scan(p.UserID)

		item, err := svc.ReviewDocument(ctx, docID, revID, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body QueueItem }{Body: *item}, nil
	})
}

func registerListCampaignQueue(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminListCampaignQueue",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/campaigns/review-queue",
		Summary:     "List campaigns pending admin review",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []CampaignQueueItem }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin", "analyst"); err != nil {
			return nil, mapAppError(err)
		}
		items, err := svc.ListCampaignReviewQueue(ctx)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []CampaignQueueItem }{Body: items}, nil
	})
}

func registerReviewCampaign(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminReviewCampaign",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/campaigns/{id}/review",
		Summary:     "Approve or reject a campaign",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string `path:"id"`
		Body ReviewInput
	}) (*struct {
		Body struct {
			Status string `json:"status"`
		}
	}, error) {
		p, err := middleware.CheckRole(ctx, "superadmin", "admin", "analyst")
		if err != nil {
			return nil, mapAppError(err)
		}

		var campID, revID pgtype.UUID
		if scanErr := campID.Scan(in.ID); scanErr != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID kampanye tidak valid", "")
		}
		_ = revID.Scan(p.UserID)

		if err := svc.ReviewCampaign(ctx, campID, revID, in.Body); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Status string `json:"status"`
			}
		}{
			Body: struct {
				Status string `json:"status"`
			}{Status: in.Body.Status},
		}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
