package middleware

import (
	"context"
	"net/http"

	"github.com/gofiber/fiber/v3"
	"github.com/uhui/backend/internal/apperr"
)

func RequireRole(allowedRoles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		p, ok := c.Locals("principal").(*Principal)
		if !ok || p == nil {
			return c.Status(http.StatusUnauthorized).JSON(apperr.NewProblemDetails(
				apperr.Unauthorized(apperr.CodeUnauthorized, "Autentikasi diperlukan", "Silakan login"),
			))
		}

		for _, r := range allowedRoles {
			if p.Role == r {
				return c.Next()
			}
		}

		return c.Status(http.StatusForbidden).JSON(apperr.NewProblemDetails(
			apperr.Forbidden(apperr.CodeForbiddenRole, "Peran akun tidak memiliki akses", "Fitur ini hanya dapat diakses peran tertentu"),
		))
	}
}

func CheckRole(ctx context.Context, allowedRoles ...string) (*Principal, error) {
	p, ok := GetPrincipal(ctx)
	if !ok || p == nil {
		return nil, apperr.Unauthorized(apperr.CodeUnauthorized, "Autentikasi diperlukan", "Silakan login")
	}
	for _, r := range allowedRoles {
		if p.Role == r {
			return p, nil
		}
	}
	return nil, apperr.Forbidden(apperr.CodeForbiddenRole, "Peran akun tidak memiliki akses", "Fitur ini hanya dapat diakses peran tertentu")
}
