package aicopilot

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

type ReportDTO struct {
	GeneratedAt time.Time         `json:"generated_at"`
	ID          string            `json:"id"`
	SMEID       string            `json:"sme_id"`
	SummaryText string            `json:"summary_text"`
	ModelName   string            `json:"model_name"`
	Anomalies   []DetectedAnomaly `json:"anomalies"`
	ActionItems []ActionItem      `json:"action_items"`
	PeriodDays  int16             `json:"period_days"`
	HealthScore int16             `json:"health_score"`
}

type AISettingsDTO struct {
	NextAIAnalysisAt *time.Time `json:"next_ai_analysis_at"`
	SMEID            string     `json:"sme_id"`
	Interval         string     `json:"interval"`
}

type Service struct {
	q *gen.Queries
}

func NewService(q *gen.Queries) *Service {
	return &Service{q: q}
}

func (s *Service) GetLatestReport(ctx context.Context, smeID uuid.UUID) (*ReportDTO, error) {
	pgSmeID := pgtype.UUID{Bytes: smeID, Valid: true}
	row, err := s.q.GetLatestDiagnosticReport(ctx, pgSmeID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("REPORT_NOT_FOUND", "Belum ada laporan Co-Pilot untuk usaha ini", "Laporan akan muncul setelah analisis terjadwal pertama")
		}
		return nil, apperr.Internal(fmt.Sprintf("get latest report: %v", err))
	}

	return toReportDTO(row.ID, row.SmeID, row.PeriodDays, row.HealthScore, row.SummaryText, row.AnomaliesJson, row.ActionItemsJson, row.ModelName, row.GeneratedAt.Time)
}

func (s *Service) ListReports(ctx context.Context, smeID uuid.UUID, limit int32) ([]ReportDTO, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	pgSmeID := pgtype.UUID{Bytes: smeID, Valid: true}
	rows, err := s.q.ListDiagnosticReports(ctx, gen.ListDiagnosticReportsParams{
		SmeID: pgSmeID,
		Limit: limit,
	})
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("list reports: %v", err))
	}

	dtos := make([]ReportDTO, 0, len(rows))
	for _, row := range rows {
		dto, rErr := toReportDTO(row.ID, row.SmeID, row.PeriodDays, row.HealthScore, row.SummaryText, row.AnomaliesJson, row.ActionItemsJson, row.ModelName, row.GeneratedAt.Time)
		if rErr != nil {
			return nil, rErr
		}
		dtos = append(dtos, *dto)
	}

	return dtos, nil
}

func (s *Service) UpdateActionItem(ctx context.Context, smeID, reportID uuid.UUID, actionItemID string, done bool) (*ReportDTO, error) {
	pgSmeID := pgtype.UUID{Bytes: smeID, Valid: true}
	pgReportID := pgtype.UUID{Bytes: reportID, Valid: true}

	row, err := s.q.GetDiagnosticReportByID(ctx, gen.GetDiagnosticReportByIDParams{
		ID:    pgReportID,
		SmeID: pgSmeID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("REPORT_NOT_FOUND", "Laporan Co-Pilot tidak ditemukan", "Periksa ID laporan")
		}
		return nil, apperr.Internal(fmt.Sprintf("get report: %v", err))
	}

	var actions []ActionItem
	if uErr := json.Unmarshal(row.ActionItemsJson, &actions); uErr != nil {
		return nil, apperr.Internal(fmt.Sprintf("unmarshal actions: %v", uErr))
	}

	found := false
	for i := range actions {
		if actions[i].ID == actionItemID {
			actions[i].Done = done
			found = true
			break
		}
	}
	if !found {
		return nil, apperr.NotFound("ACTION_ITEM_NOT_FOUND", "Item aksi tidak ditemukan", "Item aksi mungkin sudah dihapus atau tidak valid")
	}

	newBytes, _ := json.Marshal(actions)
	updated, err := s.q.UpdateReportActionItems(ctx, gen.UpdateReportActionItemsParams{
		ID:              pgReportID,
		SmeID:           pgSmeID,
		ActionItemsJson: newBytes,
	})
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("update action items: %v", err))
	}

	return toReportDTO(updated.ID, updated.SmeID, updated.PeriodDays, updated.HealthScore, updated.SummaryText, updated.AnomaliesJson, updated.ActionItemsJson, updated.ModelName, updated.GeneratedAt.Time)
}

func (s *Service) UpdateAISettings(ctx context.Context, smeID uuid.UUID, interval string) (*AISettingsDTO, error) {
	var schedInterval gen.AiScheduleInterval
	switch interval {
	case "14_days":
		schedInterval = gen.AiScheduleInterval14Days
	case "28_days":
		schedInterval = gen.AiScheduleInterval28Days
	case "disabled":
		schedInterval = gen.AiScheduleIntervalDisabled
	default:
		return nil, apperr.BadRequest("INVALID_INTERVAL", "Interval harus 14_days, 28_days, atau disabled", "Pilih frekuensi interval yang valid")
	}

	pgSmeID := pgtype.UUID{Bytes: smeID, Valid: true}
	res, err := s.q.UpdateAISettings(ctx, gen.UpdateAISettingsParams{
		ID:         pgSmeID,
		AiInterval: schedInterval,
	})
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("update ai settings: %v", err))
	}

	var nextAt *time.Time
	if res.NextAiAnalysisAt.Valid {
		t := res.NextAiAnalysisAt.Time
		nextAt = &t
	}

	return &AISettingsDTO{
		SMEID:            smeID.String(),
		Interval:         string(res.AiInterval),
		NextAIAnalysisAt: nextAt,
	}, nil
}

func toReportDTO(
	id, smeID pgtype.UUID,
	periodDays, healthScore int16,
	summary string,
	anomBytes, actBytes []byte,
	modelName string,
	genAt time.Time,
) (*ReportDTO, error) {
	var anoms []DetectedAnomaly
	if len(anomBytes) > 0 {
		_ = json.Unmarshal(anomBytes, &anoms)
	}
	var acts []ActionItem
	if len(actBytes) > 0 {
		_ = json.Unmarshal(actBytes, &acts)
	}

	return &ReportDTO{
		ID:          uuid.UUID(id.Bytes).String(),
		SMEID:       uuid.UUID(smeID.Bytes).String(),
		PeriodDays:  periodDays,
		HealthScore: healthScore,
		SummaryText: summary,
		Anomalies:   anoms,
		ActionItems: acts,
		ModelName:   modelName,
		GeneratedAt: genAt,
	}, nil
}
