package httpx

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthOutput struct {
	Body struct {
		Status string `json:"status" example:"ok" doc:"Service status"`
	}
}

type ReadyOutput struct {
	Body struct {
		Status   string `json:"status" example:"ok" doc:"Readiness status"`
		Database string `json:"database" example:"ok" doc:"Database connectivity"`
	}
}

func RegisterHealth(api huma.API, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "healthz",
		Method:      http.MethodGet,
		Path:        "/api/v1/healthz",
		Summary:     "Liveness check",
		Description: "Returns ok if the process is alive.",
		Tags:        []string{"Health"},
	}, func(ctx context.Context, input *struct{}) (*HealthOutput, error) {
		resp := &HealthOutput{}
		resp.Body.Status = "ok"
		return resp, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "readyz",
		Method:      http.MethodGet,
		Path:        "/api/v1/readyz",
		Summary:     "Readiness check",
		Description: "Returns ok if the service can serve requests. Checks database connectivity.",
		Tags:        []string{"Health"},
	}, func(ctx context.Context, input *struct{}) (*ReadyOutput, error) {
		resp := &ReadyOutput{}
		resp.Body.Status = "ok"
		resp.Body.Database = "ok"

		if pool != nil {
			if err := pool.Ping(ctx); err != nil {
				resp.Body.Status = "degraded"
				resp.Body.Database = "unreachable"
			}
		}

		return resp, nil
	})
}
