package httpx

import (
	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/cache"
	"github.com/uhui/backend/internal/config"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/llm"
	"github.com/uhui/backend/internal/middleware"
	"github.com/uhui/backend/internal/modules/admin"
	"github.com/uhui/backend/internal/modules/aicopilot"
	"github.com/uhui/backend/internal/modules/auth"
	"github.com/uhui/backend/internal/modules/bursa"
	"github.com/uhui/backend/internal/modules/community"
	"github.com/uhui/backend/internal/modules/inventory"
	"github.com/uhui/backend/internal/modules/ledger"
	"github.com/uhui/backend/internal/modules/lms"
	"github.com/uhui/backend/internal/modules/readiness"
	"github.com/uhui/backend/internal/modules/receipts"
	"github.com/uhui/backend/internal/modules/reports"
	"github.com/uhui/backend/internal/modules/sme"
	"github.com/uhui/backend/internal/payment"
	"github.com/uhui/backend/internal/storage"
)

type Dependencies struct {
	Store     storage.StorageProvider
	LLMClient llm.LLMClient
	Limiter   *cache.OCRRateLimiter
}

func RegisterRoutes(api huma.API, pool *pgxpool.Pool, cfg *config.Config, tm *middleware.TokenManager, deps ...Dependencies) {
	RegisterHealth(api, pool)

	d := resolveDependencies(deps...)

	authSvc := auth.NewService(pool, tm)
	auth.RegisterHandlers(api, authSvc, cfg)

	invSvc := inventory.NewService(pool)
	inventory.RegisterHandlers(api, invSvc, pool)

	ledgerSvc := ledger.NewService(pool)
	ledger.RegisterHandlers(api, ledgerSvc, pool)

	readinessSvc := readiness.NewService(pool, ledgerSvc)
	readiness.RegisterHandlers(api, readinessSvc, pool)

	receiptsSvc := receipts.NewService(pool, d.Store, d.LLMClient, d.Limiter)
	receipts.RegisterHandlers(api, receiptsSvc, pool)

	smeSvc := sme.NewService(pool, d.Store)
	sme.RegisterHandlers(api, smeSvc, pool)

	adminSvc := admin.NewService(pool, d.Store)
	admin.RegisterHandlers(api, adminSvc)

	q := getQueries(pool)

	payProvider := payment.NewSimulatedProvider(pool)
	payment.RegisterWalletHandlers(api, payProvider)

	lmsSvc := lms.NewService(q, payProvider)
	lms.RegisterHandlers(api, lmsSvc)

	aiSvc := aicopilot.NewService(q)
	aicopilot.RegisterHandlers(api, aiSvc, pool)

	repSvc := reports.NewService(q)
	reports.RegisterHandlers(api, repSvc, pool, q)

	registerBursaAndCommunity(api, pool, q, aiSvc, payProvider, d.Store)
}

func getQueries(pool *pgxpool.Pool) *gen.Queries {
	if pool != nil {
		return gen.New(pool)
	}
	return &gen.Queries{}
}

func registerBursaAndCommunity(api huma.API, pool *pgxpool.Pool, q *gen.Queries, aiSvc *aicopilot.Service, payProvider *payment.SimulatedProvider, store ...storage.StorageProvider) {
	campSvc := bursa.NewCampaignService(pool, q)
	investSvc := bursa.NewInvestService(pool, q, payProvider)
	distSvc := bursa.NewDistributionService(pool, q)

	bursa.RegisterPublicHandlers(api, q)
	bursa.RegisterCampaignHandlers(api, campSvc, pool)
	bursa.RegisterInvestHandlers(api, investSvc, distSvc, pool, q)
	bursa.RegisterTradingHandlers(api, q, pool, payProvider)
	bursa.RegisterBursaBoardroomAndDocs(api, q, store...)

	commSvc := community.NewService(pool, q)
	community.RegisterHubHandlers(api, commSvc, pool, q)
	community.RegisterBoardroomHandlers(api, commSvc)
	community.RegisterGroupHandlers(api, q)

	aicopilot.RegisterShareReport(api, aiSvc, commSvc, pool)
}

func resolveDependencies(deps ...Dependencies) Dependencies {
	var d Dependencies
	if len(deps) > 0 {
		d = deps[0]
	}
	if d.Store == nil {
		d.Store, _ = storage.NewLocalFS("./tmp/storage", []byte("uhui-dev-storage-secret-key-1234"), "http://localhost:8080/api/v1/storage/dev")
	}
	if d.LLMClient == nil {
		d.LLMClient = llm.NewFakeLLM()
	}
	if d.Limiter == nil {
		d.Limiter = cache.NewOCRRateLimiter()
	}
	return d
}
