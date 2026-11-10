package middleware

import (
	"context"
	"net/http"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

func RequireSMEOwner(pool *pgxpool.Pool) fiber.Handler {
	return func(c fiber.Ctx) error {
		p, ok := c.Locals("principal").(*Principal)
		if !ok || p == nil {
			return c.Status(http.StatusUnauthorized).JSON(apperr.NewProblemDetails(
				apperr.Unauthorized(apperr.CodeUnauthorized, "Autentikasi diperlukan", "Silakan login"),
			))
		}

		smeIDStr := c.Params("sme_id")
		if smeIDStr == "" {
			return c.Status(http.StatusBadRequest).JSON(apperr.NewProblemDetails(
				apperr.BadRequest(apperr.CodeBadRequest, "Parameter sme_id tidak ditemukan", "Sertakan sme_id di URL"),
			))
		}

		var smeID pgtype.UUID
		if err := smeID.Scan(smeIDStr); err != nil {
			return c.Status(http.StatusBadRequest).JSON(apperr.NewProblemDetails(
				apperr.BadRequest(apperr.CodeBadRequest, "Format sme_id tidak valid", "sme_id harus berupa UUID valid"),
			))
		}

		queries := gen.New(pool)
		sme, err := queries.GetSMEByID(c.Context(), smeID)
		if err != nil {
			return c.Status(http.StatusNotFound).JSON(apperr.NewProblemDetails(
				apperr.NotFound(apperr.CodeNotFound, "UMKM tidak ditemukan", "Periksa ID UMKM"),
			))
		}

		var ownerID pgtype.UUID
		_ = ownerID.Scan(p.UserID)
		if sme.OwnerID != ownerID {
			return c.Status(http.StatusForbidden).JSON(apperr.NewProblemDetails(
				apperr.Forbidden(apperr.CodeForbiddenTenant, "Akses silang tenant ditolak", "Anda bukan pemilik UMKM ini"),
			))
		}

		return c.Next()
	}
}

func CheckSMEOwner(ctx context.Context, pool *pgxpool.Pool, smeIDStr string) (*Principal, error) {
	p, ok := GetPrincipal(ctx)
	if !ok || p == nil {
		return nil, apperr.Unauthorized(apperr.CodeUnauthorized, "Autentikasi diperlukan", "Silakan login")
	}

	var smeID pgtype.UUID
	if err := smeID.Scan(smeIDStr); err != nil {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format sme_id tidak valid", "sme_id harus berupa UUID valid")
	}

	queries := gen.New(pool)
	sme, err := queries.GetSMEByID(ctx, smeID)
	if err != nil {
		return nil, apperr.NotFound(apperr.CodeNotFound, "UMKM tidak ditemukan", "Periksa ID UMKM")
	}

	var ownerID pgtype.UUID
	_ = ownerID.Scan(p.UserID)
	if sme.OwnerID != ownerID {
		return nil, apperr.Forbidden(apperr.CodeForbiddenTenant, "Akses silang tenant ditolak", "Anda bukan pemilik UMKM ini")
	}

	return p, nil
}

// CheckSMEOwnerActive memvalidasi kepemilikan dan memastikan bisnis TIDAK dalam status ditangguhkan (is_suspended).
func CheckSMEOwnerActive(ctx context.Context, pool *pgxpool.Pool, smeIDStr string) (*Principal, error) {
	p, err := CheckSMEOwner(ctx, pool, smeIDStr)
	if err != nil {
		return nil, err
	}

	var smeID pgtype.UUID
	_ = smeID.Scan(smeIDStr)
	queries := gen.New(pool)
	sme, err := queries.GetSMEByID(ctx, smeID)
	if err == nil && sme.IsSuspended {
		return nil, apperr.Forbidden("SME_SUSPENDED", "Bisnis sedang ditangguhkan oleh Superadmin", "Operasional bisnis dinonaktifkan selama masa penangguhan sanksi")
	}

	return p, nil
}
