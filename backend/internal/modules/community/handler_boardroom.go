package community

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/uhui/backend/internal/middleware"
)

func RegisterBoardroomHandlers(api huma.API, svc *Service) {
	registerListBoardroomThreads(api, svc)
	registerCreateBoardroomThread(api, svc)
}

func registerListBoardroomThreads(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "boardroomListThreads",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/boardroom/threads",
		Summary:     "List private boardroom discussion threads",
		Tags:        []string{"Boardroom"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Limit int32  `query:"limit"`
	}) (*struct{ Body []ThreadDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}

		threads, err := svc.ListBoardroomThreads(ctx, smeUUID, userUUID, in.Limit)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []ThreadDTO }{Body: threads}, nil
	})
}

func registerCreateBoardroomThread(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "boardroomCreateThread",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/boardroom/threads",
		Summary:     "Create a private discussion thread in the SME boardroom",
		Tags:        []string{"Boardroom"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  struct {
			AttachedAIReportID *string `json:"attached_ai_report_id,omitempty"`
			Kind               string  `json:"kind"`
			Title              string  `json:"title"`
			Content            string  `json:"content"`
		}
	}) (*struct{ Body *ThreadDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}

		var reportUUID *uuid.UUID
		if in.Body.AttachedAIReportID != nil {
			if parsed, parseErr := uuid.Parse(*in.Body.AttachedAIReportID); parseErr == nil {
				reportUUID = &parsed
			}
		}

		res, err := svc.CreateBoardroomThread(ctx, smeUUID, userUUID, in.Body.Kind, in.Body.Title, in.Body.Content, reportUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *ThreadDTO }{Body: res}, nil
	})
}
