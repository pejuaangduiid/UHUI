package admin

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/storage"
)

type Service struct {
	pool  *pgxpool.Pool
	store storage.StorageProvider
}

func NewService(pool *pgxpool.Pool, store storage.StorageProvider) *Service {
	return &Service{
		pool:  pool,
		store: store,
	}
}

type ReviewInput struct {
	Status     string `json:"status" doc:"Review decision: approved or rejected"`
	ReviewNote string `json:"review_note,omitempty" doc:"Review notes (required when rejected)"`
}

type QueueItem struct {
	ID           string     `json:"id"`
	SmeID        string     `json:"sme_id"`
	BusinessName string     `json:"business_name"`
	DocType      string     `json:"doc_type"`
	StorageKey   string     `json:"storage_key"`
	Status       string     `json:"status"`
	ReviewNote   *string    `json:"review_note,omitempty"`
	ReviewedBy   *string    `json:"reviewed_by,omitempty"`
	ReviewedAt   *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	DownloadURL  string     `json:"download_url,omitempty"`
}

func (s *Service) ListReviewQueue(ctx context.Context) ([]QueueItem, error) {
	queries := gen.New(s.pool)
	rows, err := queries.ListReviewQueue(ctx)
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("Gagal mengambil antrean verifikasi: %v", err))
	}

	res := make([]QueueItem, 0, len(rows))
	for _, row := range rows {
		item := QueueItem{
			ID:           uuidToString(row.ID),
			SmeID:        uuidToString(row.SmeID),
			BusinessName: row.BusinessName,
			DocType:      row.DocType,
			StorageKey:   row.StorageKey,
			Status:       string(row.Status),
			CreatedAt:    row.CreatedAt.Time,
		}
		if s.store != nil && row.StorageKey != "" {
			if url, err := s.store.SignedURL(ctx, row.StorageKey, 5*time.Minute); err == nil {
				item.DownloadURL = url
			}
		}
		res = append(res, item)
	}
	return res, nil
}

func (s *Service) ReviewDocument(ctx context.Context, docID, reviewerID pgtype.UUID, in ReviewInput) (*QueueItem, error) {
	targetStatus, noteText, err := parseReviewInput(in)
	if err != nil {
		return nil, err
	}

	queries := gen.New(s.pool)
	doc, err := queries.ReviewDocument(ctx, gen.ReviewDocumentParams{
		ID:         docID,
		Status:     targetStatus,
		ReviewNote: noteText,
		ReviewedBy: reviewerID,
	})
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("Gagal memperbarui status dokumen: %v", err))
	}

	if targetStatus == gen.ReviewStatusVerified {
		s.checkAndUpdateBursaListing(ctx, queries, doc.SmeID)
	}

	docDetail, err := queries.GetDocumentByID(ctx, doc.ID)
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("Gagal memuat dokumen: %v", err))
	}

	item := QueueItem{
		ID:           uuidToString(doc.ID),
		SmeID:        uuidToString(doc.SmeID),
		BusinessName: docDetail.BusinessName,
		DocType:      doc.DocType,
		StorageKey:   doc.StorageKey,
		Status:       string(doc.Status),
		CreatedAt:    doc.CreatedAt.Time,
	}
	if doc.ReviewNote.Valid {
		item.ReviewNote = &doc.ReviewNote.String
	}
	if doc.ReviewedBy.Valid {
		uid := uuidToString(doc.ReviewedBy)
		item.ReviewedBy = &uid
	}
	if doc.ReviewedAt.Valid {
		t := doc.ReviewedAt.Time
		item.ReviewedAt = &t
	}
	return &item, nil
}

func parseReviewInput(in ReviewInput) (gen.ReviewStatus, pgtype.Text, error) {
	status := strings.ToLower(strings.TrimSpace(in.Status))
	var targetStatus gen.ReviewStatus
	switch status {
	case "approved", "verified":
		targetStatus = gen.ReviewStatusVerified
	case "rejected":
		targetStatus = gen.ReviewStatusRejected
	default:
		return "", pgtype.Text{}, apperr.BadRequest(apperr.CodeBadRequest, "Status verifikasi harus approved/verified atau rejected", "")
	}

	note := strings.TrimSpace(in.ReviewNote)
	if targetStatus == gen.ReviewStatusRejected && note == "" {
		return "", pgtype.Text{}, apperr.BadRequest(apperr.CodeBadRequest, "Catatan wajib diisi saat menolak dokumen", "")
	}

	var noteText pgtype.Text
	if note != "" {
		_ = noteText.Scan(note)
	}
	return targetStatus, noteText, nil
}

func (s *Service) checkAndUpdateBursaListing(ctx context.Context, q *gen.Queries, smeID pgtype.UUID) {
	smeDocs, dErr := q.GetSMEDocuments(ctx, smeID)
	if dErr != nil {
		return
	}
	vMap := make(map[string]bool)
	for _, sd := range smeDocs {
		if sd.Status == gen.ReviewStatusVerified {
			vMap[sd.DocType] = true
		}
	}
	smeRow, sErr := q.GetSMEByID(ctx, smeID)
	if sErr != nil {
		return
	}
	hasReq := vMap["nib"] && vMap["npwp"]
	if smeRow.IsIncorporatedPt {
		hasReq = hasReq && (vMap["pt_deed"] || vMap["sk_kemenkumham"])
	}
	if hasReq && !smeRow.IsListedOnBursa {
		_, _ = s.pool.Exec(ctx, "UPDATE smes SET is_listed_on_bursa = true, updated_at = NOW() WHERE id = $1", smeID)
	}
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	src := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", src[0:4], src[4:6], src[6:8], src[8:10], src[10:16])
}
