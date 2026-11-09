package sme

import (
	"context"
	"encoding/base64"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

type UploadDocInputBody struct {
	FileBase64 string `json:"file_base64" doc:"Base64 encoded file (PDF, JPEG, PNG, or WebP)"`
	Filename   string `json:"filename,omitempty" doc:"Original filename"`
}

func RegisterHandlers(api huma.API, svc *Service, pool *pgxpool.Pool) {
	registerListMySMEs(api, svc)
	registerCreateMySME(api, svc)
	registerGetProfile(api, svc, pool)
	registerUpdateProfile(api, svc, pool)
	registerListDocuments(api, svc, pool)
	registerUploadDocument(api, svc, pool)
}

func registerListMySMEs(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "smeListMy",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes",
		Summary:     "List all businesses owned by current user",
		Tags:        []string{"SME"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []SmeDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		var uid pgtype.UUID
		if err := uid.Scan(p.UserID); err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "User ID tidak valid")
		}
		smes, err := svc.ListMySMEs(ctx, uid)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []SmeDTO }{Body: smes}, nil
	})
}

func registerCreateMySME(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "smeCreateMy",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes",
		Summary:     "Create a new business owned by current user",
		Tags:        []string{"SME"},
	}, func(ctx context.Context, in *struct {
		Body CreateSMEInput
	}) (*struct{ Body SmeDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		var uid pgtype.UUID
		if err := uid.Scan(p.UserID); err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "User ID tidak valid")
		}
		sme, err := svc.CreateMySME(ctx, uid, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body SmeDTO }{Body: *sme}, nil
	})
}

func registerGetProfile(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "smeGetProfile",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}",
		Summary:     "Get SME profile",
		Tags:        []string{"SME"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
	}) (*struct{ Body gen.Sme }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		sme, err := svc.GetProfile(ctx, sid)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body gen.Sme }{Body: *sme}, nil
	})
}

func registerUpdateProfile(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "smeUpdateProfile",
		Method:      http.MethodPatch,
		Path:        "/api/v1/smes/{sme_id}",
		Summary:     "Update SME profile",
		Tags:        []string{"SME"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  UpdateProfileInput
	}) (*struct{ Body gen.Sme }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		sme, err := svc.UpdateProfile(ctx, sid, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body gen.Sme }{Body: *sme}, nil
	})
}

func registerListDocuments(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "smeListDocuments",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/documents",
		Summary:     "List SME legal documents",
		Tags:        []string{"SME"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
	}) (*struct{ Body []DocumentItem }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		docs, err := svc.ListDocuments(ctx, sid)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []DocumentItem }{Body: docs}, nil
	})
}

func registerUploadDocument(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "smeUploadDocument",
		Method:      http.MethodPut,
		Path:        "/api/v1/smes/{sme_id}/documents/{doc_type}",
		Summary:     "Upload SME legal document",
		Tags:        []string{"SME"},
	}, func(ctx context.Context, in *struct {
		SMEID   string `path:"sme_id"`
		DocType string `path:"doc_type"`
		Body    UploadDocInputBody
	}) (*struct{ Body DocumentItem }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)

		fileBytes, err := base64.StdEncoding.DecodeString(in.Body.FileBase64)
		if err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format base64 dokumen tidak valid", "")
		}

		doc, err := svc.UploadDocument(ctx, sid, in.DocType, fileBytes)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body DocumentItem }{Body: *doc}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
