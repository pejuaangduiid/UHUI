package receipts

import (
	"context"
	"encoding/base64"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/middleware"
)

type ScanInputBody struct {
	ImageBase64 string `json:"image_base64" doc:"Base64 encoded image (JPEG, PNG, or WebP)"`
	Filename    string `json:"filename,omitempty" doc:"Original filename"`
}

func RegisterHandlers(api huma.API, svc *Service, pool *pgxpool.Pool) {
	registerScan(api, svc, pool)
	registerConfirm(api, svc, pool)
}

func registerScan(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "receiptsScan",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/receipts/scan",
		Summary:     "Scan receipt image via OCR",
		Tags:        []string{"Receipts"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  ScanInputBody
	}) (*struct{ Body ScanResult }, error) {
		p, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID)
		if err != nil {
			return nil, mapAppError(err)
		}
		var sid, uid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		_ = uid.Scan(p.UserID)

		imgBytes, err := base64.StdEncoding.DecodeString(in.Body.ImageBase64)
		if err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format base64 gambar tidak valid", "")
		}

		res, err := svc.ScanReceipt(ctx, sid, uid, imgBytes, in.Body.Filename)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body ScanResult }{Body: *res}, nil
	})
}

func registerConfirm(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "receiptsConfirm",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/receipts/confirm",
		Summary:     "Confirm OCR scan to ledger",
		Tags:        []string{"Receipts"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  ConfirmInput
	}) (*struct {
		Body struct {
			Status string `json:"status"`
		}
	}, error) {
		p, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID)
		if err != nil {
			return nil, mapAppError(err)
		}
		var sid, uid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		_ = uid.Scan(p.UserID)

		_, err = svc.ConfirmScan(ctx, sid, uid, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Status string `json:"status"`
			}
		}{
			Body: struct {
				Status string `json:"status"`
			}{Status: "confirmed"},
		}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
