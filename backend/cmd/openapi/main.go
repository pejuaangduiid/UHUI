package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humafiber"
	"github.com/gofiber/fiber/v3"
	"github.com/uhui/backend/internal/config"
	"github.com/uhui/backend/internal/httpx"
	"github.com/uhui/backend/internal/middleware"
)

func main() {
	app := fiber.New()

	humaConfig := huma.DefaultConfig("UHUI API", "0.1.0")
	humaConfig.Info.Description = "Platform Digitalisasi UMKM & Bursa Mikro-Ekuitas (Simulasi)"

	api := humafiber.New(app, humaConfig)

	cfg := &config.Config{
		AppEnv:        "dev",
		AllowedOrigin: "http://localhost:3000",
	}
	tm, _ := middleware.NewTokenManager(nil, nil)

	httpx.RegisterRoutes(api, nil, cfg, tm)

	spec, err := json.MarshalIndent(api.OpenAPI(), "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to marshal openapi: %v\n", err)
		os.Exit(1)
	}

	outPath := "openapi.json"
	if len(os.Args) > 1 {
		outPath = os.Args[1]
	}

	if err := os.WriteFile(outPath, spec, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "failed to write %s: %v\n", outPath, err)
		os.Exit(1)
	}

	fmt.Printf("OpenAPI spec written to %s (%d bytes)\n", outPath, len(spec))
}
