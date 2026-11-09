package middleware

import (
	"net/http"

	"github.com/gofiber/fiber/v3"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/config"
)

func OriginCSRF(cfg *config.Config) fiber.Handler {
	return func(c fiber.Ctx) error {
		method := c.Method()
		if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
			return c.Next()
		}

		origin := c.Get("Origin")
		if origin == "" {
			return c.Status(http.StatusForbidden).JSON(apperr.NewProblemDetails(
				apperr.Forbidden(apperr.CodeCSRFMissingOrigin, "Missing Origin header", "Semua permintaan mutasi wajib menyertakan header Origin"),
			))
		}

		if origin != cfg.AllowedOrigin {
			return c.Status(http.StatusForbidden).JSON(apperr.NewProblemDetails(
				apperr.Forbidden(apperr.CodeCSRFOriginMismatch, "Origin mismatch", "Header Origin tidak diizinkan"),
			))
		}

		return c.Next()
	}
}
