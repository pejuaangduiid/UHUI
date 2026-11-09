package aicopilot

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/cache"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/llm"
	"github.com/uhui/backend/internal/metrics"
)

type ActionItem struct {
	ID   string `json:"id"`
	Text string `json:"text"`
	Done bool   `json:"done"`
}

type DetectedAnomaly struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type Pipeline struct {
	pool  *pgxpool.Pool
	q     *gen.Queries
	llm   llm.LLMClient
	cache cache.Cacher
}

func NewPipeline(pool *pgxpool.Pool, q *gen.Queries, llmClient llm.LLMClient, c cache.Cacher) *Pipeline {
	return &Pipeline{
		pool:  pool,
		q:     q,
		llm:   llmClient,
		cache: c,
	}
}

func (p *Pipeline) RunAnalysis(ctx context.Context, smeID pgtype.UUID, interval gen.AiScheduleInterval) error {
	periodDays := int16(14)
	if interval == gen.AiScheduleInterval28Days {
		periodDays = 28
	}

	today := time.Now().Truncate(24 * time.Hour)
	periodStart := today.AddDate(0, 0, -int(periodDays-1))

	score, rev, exp, netCash, err := p.computeFinancials(ctx, smeID, periodStart, today)
	if err != nil {
		_ = p.q.MarkAnalysisFailure(ctx, smeID)
		return fmt.Errorf("compute financials: %w", err)
	}

	candidates, candidateIDs, err := DetectCandidates(ctx, p.q, smeID, periodStart, rev, netCash)
	if err != nil {
		_ = p.q.MarkAnalysisFailure(ctx, smeID)
		return fmt.Errorf("detect candidates: %w", err)
	}

	out, err := p.callLLM(ctx, smeID, candidateIDs, rev, exp, netCash)
	if err != nil {
		_ = p.q.MarkAnalysisFailure(ctx, smeID)
		return fmt.Errorf("generate insight: %w", err)
	}

	if valErr := llm.ValidateCopilotOutput(out, candidateIDs); valErr != nil {
		_ = p.q.MarkAnalysisFailure(ctx, smeID)
		return fmt.Errorf("validate output: %w", valErr)
	}

	return p.saveSuccess(ctx, smeID, periodDays, score, candidates, out)
}

func (p *Pipeline) computeFinancials(ctx context.Context, smeID pgtype.UUID, start, end time.Time) (int, int64, int64, int64, error) {
	fin, err := p.q.GetPeriodFinancials(ctx, gen.GetPeriodFinancialsParams{
		SmeID:    smeID,
		TxDate:   pgtype.Timestamptz{Time: start, Valid: true},
		TxDate_2: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return 0, 0, 0, 0, err
	}

	totalExp := fin.RestockExpenseIdr + fin.OperationalExpenseIdr
	netCash := fin.RevenueIdr - totalExp
	compA := metrics.ComputeComponentA(int(fin.ActiveDays))
	compC := metrics.ComputeComponentC(netCash, fin.RevenueIdr)
	score := HealthScore(compA, nil, compC)

	return score, fin.RevenueIdr, totalExp, netCash, nil
}

func (p *Pipeline) callLLM(ctx context.Context, smeID pgtype.UUID, candidateIDs []string, rev, exp, netCash int64) (*llm.InsightOutput, error) {
	smeUUID := uuid.UUID(smeID.Bytes).String()
	in := llm.InsightInput{
		SMEID:        smeUUID,
		CandidateIDs: candidateIDs,
		SalesIDR:     rev,
		ExpensesIDR:  exp,
		NetCashIDR:   netCash,
	}
	return p.llm.GenerateInsight(ctx, in)
}

func (p *Pipeline) saveSuccess(
	ctx context.Context,
	smeID pgtype.UUID,
	periodDays int16,
	healthScore int,
	candidates []CandidateAnomaly,
	out *llm.InsightOutput,
) error {
	anomJSON, actionsJSON := buildReportPayloads(candidates, out)

	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := p.q.WithTx(tx)
	_, err = qtx.InsertDiagnosticReport(ctx, gen.InsertDiagnosticReportParams{
		SmeID:           smeID,
		PeriodDays:      periodDays,
		HealthScore:     int16(healthScore),
		SummaryText:     out.SummaryText,
		AnomaliesJson:   anomJSON,
		ActionItemsJson: actionsJSON,
		ModelName:       p.llm.Name(),
	})
	if err != nil {
		return fmt.Errorf("insert diagnostic report: %w", err)
	}

	if err = qtx.MarkAnalysisSuccess(ctx, smeID); err != nil {
		return fmt.Errorf("mark analysis success: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}

	smeUUID := uuid.UUID(smeID.Bytes).String()
	_ = p.cache.Del(ctx, "dash:sme:"+smeUUID)
	return nil
}

func buildReportPayloads(candidates []CandidateAnomaly, out *llm.InsightOutput) ([]byte, []byte) {
	anomMap := make(map[string]CandidateAnomaly, len(candidates))
	for _, c := range candidates {
		anomMap[c.ID] = c
	}

	detected := make([]DetectedAnomaly, 0, len(out.Anomalies))
	for _, aID := range out.Anomalies {
		if item, ok := anomMap[aID]; ok {
			detected = append(detected, DetectedAnomaly(item))
		}
	}

	actions := make([]ActionItem, 0, len(out.ActionItems))
	for _, item := range out.ActionItems {
		actions = append(actions, ActionItem{
			ID:   uuid.NewString(),
			Text: item,
			Done: false,
		})
	}

	anomJSON, _ := json.Marshal(detected)
	actionsJSON, _ := json.Marshal(actions)
	return anomJSON, actionsJSON
}
