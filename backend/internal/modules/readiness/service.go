package readiness

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/metrics"
	"github.com/uhui/backend/internal/modules/ledger"
)

type Service struct {
	pool      *pgxpool.Pool
	ledgerSvc *ledger.Service
}

func NewService(pool *pgxpool.Pool, ledgerSvc *ledger.Service) *Service {
	return &Service{
		pool:      pool,
		ledgerSvc: ledgerSvc,
	}
}

type ScoreOutput struct {
	PeriodStart  time.Time `json:"period_start"`
	PeriodEnd    time.Time `json:"period_end"`
	ComputedAt   time.Time `json:"computed_at"`
	ComponentB   *int      `json:"component_b"`
	Total        *int      `json:"total"`
	Scheme       string    `json:"scheme"`
	GateFailures []string  `json:"gate_failures"`
	ComponentA   int       `json:"component_a"`
	ComponentC   int       `json:"component_c"`
	ComponentD   int       `json:"component_d"`
	Version      int32     `json:"scoring_version"`
	GatePassed   bool      `json:"gate_passed"`
}

func (s *Service) PreviewScore(ctx context.Context, smeID pgtype.UUID, scheme string) (*ScoreOutput, error) {
	cleanScheme := strings.ToLower(strings.TrimSpace(scheme))
	if cleanScheme != "revenue_sharing" && cleanScheme != "micro_equity" {
		cleanScheme = "revenue_sharing"
	}
	return s.calculateScore(ctx, smeID, cleanScheme)
}

func (s *Service) SubmitScore(ctx context.Context, smeID pgtype.UUID, scheme string) (*ScoreOutput, error) {
	out, err := s.PreviewScore(ctx, smeID, scheme)
	if err != nil {
		return nil, err
	}

	failuresJSON, _ := json.Marshal(out.GateFailures)
	var compB, tot pgtype.Int2
	if out.ComponentB != nil {
		compB = pgtype.Int2{Int16: int16(*out.ComponentB), Valid: true}
	}
	if out.Total != nil {
		tot = pgtype.Int2{Int16: int16(*out.Total), Valid: true}
	}

	queries := gen.New(s.pool)
	_, err = queries.CreateReadinessScore(ctx, gen.CreateReadinessScoreParams{
		SmeID:            smeID,
		Scheme:           gen.FundingScheme(out.Scheme),
		ScoringVersion:   out.Version,
		PeriodStart:      pgtype.Date{Time: out.PeriodStart, Valid: true},
		PeriodEnd:        pgtype.Date{Time: out.PeriodEnd, Valid: true},
		ComponentA:       int16(out.ComponentA),
		ComponentB:       compB,
		ComponentC:       int16(out.ComponentC),
		ComponentD:       int16(out.ComponentD),
		Total:            tot,
		GatePassed:       out.GatePassed,
		GateFailuresJson: failuresJSON,
	})
	if err != nil {
		return nil, fmt.Errorf("create readiness snapshot: %w", err)
	}

	return out, nil
}

func (s *Service) calculateScore(ctx context.Context, smeID pgtype.UUID, scheme string) (*ScoreOutput, error) {
	agg, err := s.ledgerSvc.GetAggregates30Days(ctx, smeID)
	if err != nil {
		return nil, err
	}

	queries := gen.New(s.pool)
	sme, err := queries.GetSMEByID(ctx, smeID)
	if err != nil {
		return nil, apperr.NotFound(apperr.CodeNotFound, "UMKM tidak ditemukan", "")
	}

	docs, err := queries.GetSMEDocuments(ctx, smeID)
	if err != nil {
		return nil, err
	}
	verifiedDocs := make(map[string]bool)
	for _, d := range docs {
		if d.Status == gen.ReviewStatusVerified {
			verifiedDocs[d.DocType] = true
		}
	}

	cfg, err := queries.GetLatestReadinessConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("get readiness config: %w", err)
	}

	var wCfg metrics.ConfigWeights
	_ = json.Unmarshal(cfg.WeightsJson, &wCfg)

	profileComplete := (sme.BusinessName != "" && sme.Sector != "" && len(sme.Description) >= 50)
	now := time.Now().In(metrics.WIB)
	start, end := metrics.Window30(now)

	compA := metrics.ComputeComponentA(agg.ActiveDaysCount)
	compB := metrics.ComputeComponentB(agg.RestockCount, agg.RestockVerifiedIDR, agg.RestockTotalIDR, int(cfg.NMinRestock))
	compC := metrics.ComputeComponentC(agg.NetCashFlowIDR, agg.RevenueIDR)
	compD := metrics.ComputeComponentD(scheme, verifiedDocs, profileComplete, wCfg.DItems)
	total := metrics.ComputeTotal(compA, compB, compC, compD, wCfg.W)

	failures := metrics.EvaluateGates(scheme, sme.IsIncorporatedPt, verifiedDocs, compB, agg.FirstTxDate, now, int(cfg.MinHistoryDays), total, int(cfg.MinListingScore))

	return &ScoreOutput{
		Scheme:       scheme,
		Version:      cfg.Version,
		PeriodStart:  start,
		PeriodEnd:    end,
		ComponentA:   compA,
		ComponentB:   compB,
		ComponentC:   compC,
		ComponentD:   compD,
		Total:        total,
		GatePassed:   len(failures) == 0,
		GateFailures: failures,
		ComputedAt:   now,
	}, nil
}

func (s *Service) GetLatestScore(ctx context.Context, smeID pgtype.UUID, scheme string) (*ScoreOutput, error) {
	queries := gen.New(s.pool)
	row, err := queries.GetLatestReadinessScore(ctx, gen.GetLatestReadinessScoreParams{
		SmeID:  smeID,
		Scheme: gen.FundingScheme(scheme),
	})
	if err != nil {
		return nil, apperr.NotFound(apperr.CodeNotFound, "Belum ada snapshot skor untuk skema ini", "")
	}

	var failures []string
	_ = json.Unmarshal(row.GateFailuresJson, &failures)

	var compB, tot *int
	if row.ComponentB.Valid {
		v := int(row.ComponentB.Int16)
		compB = &v
	}
	if row.Total.Valid {
		v := int(row.Total.Int16)
		tot = &v
	}

	return &ScoreOutput{
		Scheme:       string(row.Scheme),
		Version:      row.ScoringVersion,
		PeriodStart:  row.PeriodStart.Time,
		PeriodEnd:    row.PeriodEnd.Time,
		ComponentA:   int(row.ComponentA),
		ComponentB:   compB,
		ComponentC:   int(row.ComponentC),
		ComponentD:   int(row.ComponentD),
		Total:        tot,
		GatePassed:   row.GatePassed,
		GateFailures: failures,
		ComputedAt:   row.ComputedAt.Time,
	}, nil
}
