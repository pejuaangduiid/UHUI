package reports

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

type KeyFigures struct {
	TotalRevenueIDR int64 `json:"total_revenue_idr"`
	NetProfitIDR    int64 `json:"net_profit_idr"`
	TxCount         int64 `json:"tx_count"`
}

type VerificationDTO struct {
	CreatedAt    time.Time   `json:"created_at"`
	Figures      *KeyFigures `json:"figures"`
	Status       string      `json:"status"`
	DocType      string      `json:"doc_type"`
	BusinessName string      `json:"business_name"`
	Sector       string      `json:"sector"`
	PeriodStart  string      `json:"period_start"`
	PeriodEnd    string      `json:"period_end"`
	SHA256       string      `json:"sha256"`
}

type SnapshotDTO struct {
	CreatedAt   time.Time       `json:"created_at"`
	ID          string          `json:"id"`
	SMEID       string          `json:"sme_id"`
	DocType     string          `json:"doc_type"`
	PeriodStart string          `json:"period_start"`
	PeriodEnd   string          `json:"period_end"`
	SHA256      string          `json:"sha256"`
	Payload     json.RawMessage `json:"payload"`
}

type Service struct {
	q   *gen.Queries
	agg *Aggregator
}

func NewService(q *gen.Queries) *Service {
	return &Service{
		q:   q,
		agg: NewAggregator(q),
	}
}

func (s *Service) GetOrCreateSnapshot(ctx context.Context, smeID uuid.UUID, docType, periodMonth string) (*SnapshotDTO, error) {
	start, end, err := parsePeriod(periodMonth)
	if err != nil {
		return nil, apperr.BadRequest("INVALID_PERIOD", err.Error(), "Format periode harus YYYY-MM")
	}

	pgSmeID := pgtype.UUID{Bytes: smeID, Valid: true}
	canonicalBytes, err := s.generatePayload(ctx, pgSmeID, docType, start, end)
	if err != nil {
		return nil, err
	}

	hash := ComputeHash(canonicalBytes)
	row, err := s.q.InsertSnapshot(ctx, gen.InsertSnapshotParams{
		SmeID:       pgSmeID,
		DocType:     docType,
		PeriodStart: pgtype.Date{Time: start, Valid: true},
		PeriodEnd:   pgtype.Date{Time: end, Valid: true},
		PayloadJson: canonicalBytes,
		Sha256:      hash[:],
	})
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.Internal(fmt.Sprintf("insert snapshot: %v", err))
		}
	}

	if !row.ID.Valid {
		existing, gErr := s.q.GetSnapshotByHash(ctx, hash[:])
		if gErr != nil {
			return nil, apperr.Internal(fmt.Sprintf("get existing snapshot: %v", gErr))
		}
		row = existing
	}

	return &SnapshotDTO{
		ID:          uuid.UUID(row.ID.Bytes).String(),
		SMEID:       smeID.String(),
		DocType:     row.DocType,
		PeriodStart: row.PeriodStart.Time.Format("2006-01-02"),
		PeriodEnd:   row.PeriodEnd.Time.Format("2006-01-02"),
		SHA256:      HexFromHash(hash),
		Payload:     row.PayloadJson,
		CreatedAt:   row.CreatedAt.Time,
	}, nil
}

func (s *Service) generatePayload(ctx context.Context, smeID pgtype.UUID, docType string, start, end time.Time) ([]byte, error) {
	var payload any
	var err error

	switch docType {
	case "sak_emkm":
		payload, err = s.agg.BuildSakEmkm(ctx, smeID, start, end)
	case "prospectus":
		payload, err = s.agg.BuildProspectus(ctx, smeID, start, end)
	case "shareholder_monthly":
		payload, err = s.agg.BuildShareholderMonthly(ctx, smeID, start, end)
	default:
		return nil, apperr.BadRequest("INVALID_DOC_TYPE", "Jenis dokumen harus sak_emkm, prospectus, atau shareholder_monthly", "Pilih jenis dokumen yang valid")
	}

	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("build payload: %v", err))
	}

	canonicalBytes, err := Canonicalize(payload)
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("canonicalize payload: %v", err))
	}
	return canonicalBytes, nil
}

func (s *Service) GetPublicVerification(ctx context.Context, hexHash string) (*VerificationDTO, error) {
	hash, err := HashFromHex(hexHash)
	if err != nil {
		return nil, apperr.NotFound("SNAPSHOT_NOT_FOUND", "Dokumen tidak ditemukan atau hash tidak valid", "Periksa kembali URL atau hash verifikasi")
	}

	row, err := s.q.GetSnapshotByHash(ctx, hash[:])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("SNAPSHOT_NOT_FOUND", "Dokumen tidak ditemukan", "Hash verifikasi tidak cocok dengan arsip kami")
		}
		return nil, apperr.Internal(fmt.Sprintf("query snapshot: %v", err))
	}

	sme, err := s.q.GetSMEVerificationDetails(ctx, row.SmeID)
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("query sme: %v", err))
	}

	var figures *KeyFigures
	if sme.VerifyShowFigures {
		figures = extractKeyFigures(row.DocType, row.PayloadJson)
	}

	return &VerificationDTO{
		Status:       "authentic",
		DocType:      row.DocType,
		BusinessName: sme.BusinessName,
		Sector:       sme.Sector,
		PeriodStart:  row.PeriodStart.Time.Format("2006-01-02"),
		PeriodEnd:    row.PeriodEnd.Time.Format("2006-01-02"),
		SHA256:       hexHash,
		CreatedAt:    row.CreatedAt.Time,
		Figures:      figures,
	}, nil
}

type keyFiguresRaw struct {
	RevenueIDR    int64 `json:"revenue_idr"`
	Revenue30dIDR int64 `json:"revenue_30d_idr"`
	NetProfitIDR  int64 `json:"net_profit_idr"`
	NetCash30dIDR int64 `json:"net_cash_30d_idr"`
	TxCount       int64 `json:"tx_count"`
}

func extractKeyFigures(docType string, payloadJSON []byte) *KeyFigures {
	var raw keyFiguresRaw
	if err := json.Unmarshal(payloadJSON, &raw); err != nil {
		return nil
	}

	fig := &KeyFigures{}
	if raw.RevenueIDR > 0 {
		fig.TotalRevenueIDR = raw.RevenueIDR
	} else {
		fig.TotalRevenueIDR = raw.Revenue30dIDR
	}

	if raw.NetProfitIDR != 0 {
		fig.NetProfitIDR = raw.NetProfitIDR
	} else {
		fig.NetProfitIDR = raw.NetCash30dIDR
	}

	fig.TxCount = raw.TxCount
	return fig
}

func parsePeriod(periodStr string) (time.Time, time.Time, error) {
	if periodStr == "" {
		periodStr = time.Now().Format("2006-01")
	}
	t, err := time.Parse("2006-01", periodStr)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("format periode harus YYYY-MM (mis. 2026-10)")
	}
	start := time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, -1)
	return start, end, nil
}
