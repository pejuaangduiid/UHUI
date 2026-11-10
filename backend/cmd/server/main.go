package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/cache"
	"github.com/uhui/backend/internal/config"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/httpx"
	"github.com/uhui/backend/internal/llm"
	"github.com/uhui/backend/internal/middleware"
	"github.com/uhui/backend/internal/modules/aicopilot"
	"github.com/uhui/backend/internal/modules/bursa"
	"github.com/uhui/backend/internal/payment"
	"github.com/uhui/backend/internal/scheduler"
	"github.com/uhui/backend/internal/storage"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	tm, err := middleware.NewTokenManager(nil, nil)
	if err != nil {
		slog.Error("failed to create token manager", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if pingErr := pool.Ping(ctx); pingErr != nil {
		slog.Warn("database ping failed", "error", pingErr)
	} else {
		slog.Info("database connected")
	}

	app, api := httpx.NewServer(cfg, tm)
	localFS, llmClient := setupDevServices(app, pool, cfg)

	httpx.RegisterRoutes(api, pool, cfg, tm, httpx.Dependencies{
		Store:     localFS,
		LLMClient: llmClient,
	})

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		slog.Info("starting server", "addr", cfg.HTTPAddr)
		if err := app.Listen(cfg.HTTPAddr); err != nil {
			slog.Error("server error", "error", err)
		}
	}()

	<-quit
	slog.Info("shutting down...")

	if err := app.Shutdown(); err != nil {
		slog.Error("shutdown error", "error", err)
	}

	slog.Info("server stopped")
}

func setupDevServices(app *fiber.App, pool *pgxpool.Pool, cfg *config.Config) (storage.StorageProvider, llm.LLMClient) {
	localFS, _ := storage.NewLocalFS(cfg.StorageLocalDir, []byte("uhui-dev-storage-secret-key-1234"), cfg.StoragePublicBaseURL)
	storage.RegisterDevStorageHandler(app, localFS)

	var llmClient llm.LLMClient
	if cfg.GeminiAPIKey != "" {
		llmClient = llm.NewGeminiClient(cfg.GeminiAPIKey, cfg.GeminiModel)
		slog.Info("Gemini AI client initialized", "model", cfg.GeminiModel)
	} else {
		llmClient = llm.NewFakeLLM()
		slog.Info("using FakeLLM for development")
	}

	q := gen.New(pool)
	pipeline := aicopilot.NewPipeline(pool, q, llmClient, cache.NewL1())
	closer := bursa.NewCampaignCloser(pool, q, payment.NewSimulatedProvider(pool))
	sched, err := scheduler.NewScheduler(pipeline, q, closer)
	if err != nil {
		slog.Warn("scheduler initialization failed", "error", err)
	} else {
		sched.Start()
		slog.Info("background scheduler started")
	}
	return localFS, llmClient
}
