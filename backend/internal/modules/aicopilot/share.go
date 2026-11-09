package aicopilot

import (
	"context"
	"fmt"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
	"github.com/uhui/backend/internal/modules/community"
)

type ShareReportReq struct {
	Note    string `json:"note,omitempty"`
	Confirm bool   `json:"confirm"`
}

type ShareReportResp struct {
	ThreadID string `json:"thread_id"`
	Status   string `json:"status"`
}

func RegisterShareReport(api huma.API, svc *Service, poster community.Poster, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "aiReportShareToBoardroom",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/ai/reports/{id}/share",
		Summary:     "Share an AI diagnostic report to the private boardroom",
		Tags:        []string{"AICopilot"},
	}, func(ctx context.Context, in *struct {
		SMEID string         `path:"sme_id"`
		ID    string         `path:"id"`
		Body  ShareReportReq `json:"body"`
	}) (*struct{ Body *ShareReportResp }, error) {
		p, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID)
		if err != nil {
			return nil, mapAppError(err)
		}
		if !in.Body.Confirm {
			return nil, huma.NewError(http.StatusBadRequest, "Konfirmasi eksplisit diperlukan sebelum membagikan laporan ke pemegang saham")
		}

		smeUUID, err := uuid.Parse(in.SMEID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid sme_id")
		}
		repUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid report id")
		}
		authorUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		rep, err := svc.q.GetDiagnosticReportByID(ctx, gen.GetDiagnosticReportByIDParams{
			ID:    pgtype.UUID{Bytes: repUUID, Valid: true},
			SmeID: pgtype.UUID{Bytes: smeUUID, Valid: true},
		})
		if err != nil {
			return nil, huma.NewError(http.StatusNotFound, "Laporan AI tidak ditemukan")
		}

		title := fmt.Sprintf("Laporan Diagnostik AI (Skor Kesehatan: %d/100)", rep.HealthScore)
		content := rep.SummaryText
		if in.Body.Note != "" {
			content = fmt.Sprintf("%s\n\nRingkasan Diagnostik:\n%s", in.Body.Note, rep.SummaryText)
		}

		th, err := poster.PostToBoardroom(ctx, smeUUID, authorUUID, title, content, &repUUID)
		if err != nil {
			return nil, mapAppError(err)
		}

		return &struct{ Body *ShareReportResp }{
			Body: &ShareReportResp{
				ThreadID: th.ID,
				Status:   "shared",
			},
		}, nil
	})
}
