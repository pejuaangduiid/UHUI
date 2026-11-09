package readiness

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/middleware"
)

func RegisterHandlers(api huma.API, svc *Service, pool *pgxpool.Pool) {
	registerPreview(api, svc, pool)
	registerSubmit(api, svc, pool)
	registerLatest(api, svc, pool)
}

func registerPreview(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "readinessPreview",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/readiness",
		Summary:     "Preview readiness score and gates (non-persisted)",
		Tags:        []string{"Readiness"},
	}, func(ctx context.Context, in *struct {
		SMEID  string `path:"sme_id"`
		Scheme string `query:"scheme" default:"revenue_sharing"`
	}) (*struct{ Body ScoreOutput }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)

		out, err := svc.PreviewScore(ctx, sid, in.Scheme)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body ScoreOutput }{Body: *out}, nil
	})
}

func registerSubmit(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "readinessSubmit",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/readiness/submissions",
		Summary:     "Submit and store immutable readiness snapshot",
		Tags:        []string{"Readiness"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  struct {
			Scheme string `json:"scheme" default:"revenue_sharing"`
		}
	}) (*struct{ Body ScoreOutput }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)

		out, err := svc.SubmitScore(ctx, sid, in.Body.Scheme)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body ScoreOutput }{Body: *out}, nil
	})
}

func registerLatest(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "readinessLatest",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/readiness/submissions/latest",
		Summary:     "Get latest stored readiness snapshot",
		Tags:        []string{"Readiness"},
	}, func(ctx context.Context, in *struct {
		SMEID  string `path:"sme_id"`
		Scheme string `query:"scheme" default:"revenue_sharing"`
	}) (*struct{ Body ScoreOutput }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)

		out, err := svc.GetLatestScore(ctx, sid, in.Scheme)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body ScoreOutput }{Body: *out}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
