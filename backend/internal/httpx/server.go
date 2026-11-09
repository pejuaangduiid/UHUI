package httpx

import (
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humafiber"
	"github.com/gofiber/fiber/v3"
	"github.com/uhui/backend/internal/config"
	"github.com/uhui/backend/internal/middleware"
)

func NewServer(cfg *config.Config, tm *middleware.TokenManager) (*fiber.App, huma.API) {
	app := fiber.New(fiber.Config{
		AppName:   "UHUI API",
		BodyLimit: 5 * 1024 * 1024,
	})

	limiter := middleware.NewMemoryRateLimiter(60, time.Minute)

	app.Use(middleware.RequestID())
	app.Use(middleware.AccessLog())
	app.Use(middleware.SecurityHeaders(cfg))
	app.Use(middleware.OriginCSRF(cfg))
	app.Use(limiter.Handler())

	if tm != nil {
		app.Use(middleware.AuthJWT(tm, cfg, false))
	}

	humaConfig := huma.DefaultConfig("UHUI API", "0.1.0")
	humaConfig.Info.Description = "Platform Digitalisasi UMKM & Bursa Mikro-Ekuitas (Simulasi)"

	api := humafiber.New(app, humaConfig)

	return app, api
}
