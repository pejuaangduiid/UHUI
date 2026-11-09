package aicopilot

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
	registerLatestReport(api, svc, pool)
	registerListReports(api, svc, pool)
	registerActionItemUpdate(api, svc, pool)
	registerSettingsUpdate(api, svc, pool)
}

func registerLatestReport(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "aiReportLatest",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/ai/reports/latest",
		Summary:     "Get latest AI Co-Pilot report",
		Tags:        []string{"AICopilot"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
	}) (*struct{ Body *ReportDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		rep, err := svc.GetLatestReport(ctx, smeUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *ReportDTO }{Body: rep}, nil
	})
}

func registerListReports(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "aiReportList",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/ai/reports",
		Summary:     "List AI Co-Pilot reports",
		Tags:        []string{"AICopilot"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Limit int32  `query:"limit" default:"20"`
	}) (*struct{ Body []ReportDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		reps, err := svc.ListReports(ctx, smeUUID, in.Limit)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []ReportDTO }{Body: reps}, nil
	})
}

func registerActionItemUpdate(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "aiActionItemUpdate",
		Method:      http.MethodPatch,
		Path:        "/api/v1/smes/{sme_id}/ai/reports/{report_id}/action-items/{id}",
		Summary:     "Update action item status",
		Tags:        []string{"AICopilot"},
	}, func(ctx context.Context, in *struct {
		SMEID    string `path:"sme_id"`
		ReportID string `path:"report_id"`
		ID       string `path:"id"`
		Body     struct {
			Done bool `json:"done"`
		}
	}) (*struct{ Body *ReportDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		repUUID, err := uuid.Parse(in.ReportID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid report_id")
		}
		updated, err := svc.UpdateActionItem(ctx, smeUUID, repUUID, in.ID, in.Body.Done)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *ReportDTO }{Body: updated}, nil
	})
}

func registerSettingsUpdate(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "aiSettingsUpdate",
		Method:      http.MethodPatch,
		Path:        "/api/v1/smes/{sme_id}/ai/settings",
		Summary:     "Update AI Co-Pilot settings",
		Tags:        []string{"AICopilot"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  struct {
			Interval string `json:"interval"`
		}
	}) (*struct{ Body *AISettingsDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		settings, err := svc.UpdateAISettings(ctx, smeUUID, in.Body.Interval)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *AISettingsDTO }{Body: settings}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
