package reports

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

func RegisterHandlers(api huma.API, svc *Service, pool *pgxpool.Pool, q *gen.Queries) {
	registerGetReport(api, svc, pool)
	registerVerify(api, svc)
	registerSettings(api, q, pool)
}

func registerGetReport(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "reportGet",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/reports/{doc_type}",
		Summary:     "Get or generate canonical report snapshot",
		Tags:        []string{"Reports"},
	}, func(ctx context.Context, in *struct {
		SMEID   string `path:"sme_id"`
		DocType string `path:"doc_type"`
		Period  string `query:"period"`
	}) (*struct{ Body *SnapshotDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		snap, err := svc.GetOrCreateSnapshot(ctx, smeUUID, in.DocType, in.Period)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *SnapshotDTO }{Body: snap}, nil
	})
}

func registerVerify(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "reportVerify",
		Method:      http.MethodGet,
		Path:        "/api/v1/verify/{sha256}",
		Summary:     "Public document verification",
		Tags:        []string{"PublicVerification"},
	}, func(ctx context.Context, in *struct {
		SHA256 string `path:"sha256"`
	}) (*struct{ Body *VerificationDTO }, error) {
		res, err := svc.GetPublicVerification(ctx, in.SHA256)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *VerificationDTO }{Body: res}, nil
	})
}

func registerSettings(api huma.API, q *gen.Queries, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "reportSettingsUpdate",
		Method:      http.MethodPatch,
		Path:        "/api/v1/smes/{sme_id}/reports/settings",
		Summary:     "Update report verification privacy settings",
		Tags:        []string{"Reports"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  struct {
			VerifyShowFigures bool `json:"verify_show_figures"`
		}
	}) (*struct {
		Body struct {
			VerifyShowFigures bool `json:"verify_show_figures"`
		}
	}, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		pgSmeID := pgtype.UUID{Bytes: smeUUID, Valid: true}
		res, err := q.UpdateVerifyShowFigures(ctx, gen.UpdateVerifyShowFiguresParams{
			ID:                pgSmeID,
			VerifyShowFigures: in.Body.VerifyShowFigures,
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, err.Error())
		}
		out := struct {
			VerifyShowFigures bool `json:"verify_show_figures"`
		}{VerifyShowFigures: res.VerifyShowFigures}
		return &struct {
			Body struct {
				VerifyShowFigures bool `json:"verify_show_figures"`
			}
		}{Body: out}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
