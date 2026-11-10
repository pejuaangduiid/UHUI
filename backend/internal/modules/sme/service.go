package sme

import (
	"bytes"
	"context"
	"crypto/rand"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/storage"
)

var slugRegex = regexp.MustCompile(`[^a-z0-9]+`)

type CreateSMEInput struct {
	BusinessName     string `json:"business_name" doc:"Nama usaha"`
	Sector           string `json:"sector" doc:"Sektor usaha"`
	Description      string `json:"description,omitempty" doc:"Deskripsi profil usaha"`
	IsIncorporatedPt bool   `json:"is_incorporated_pt" doc:"Apakah berbadan hukum PT"`
}

type SmeDTO struct {
	ID                    string `json:"id" example:"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"`
	OwnerID               string `json:"owner_id" example:"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"`
	BusinessName          string `json:"business_name" example:"Kopi Makmur"`
	Slug                  string `json:"slug" example:"kopi-makmur-1234"`
	Sector                string `json:"sector" example:"Kuliner"`
	Description           string `json:"description" example:"Kedai kopi lokal"`
	AiInterval            string `json:"ai_interval"`
	DigitalReadinessScore int16  `json:"digital_readiness_score"`
	IsIncorporatedPt      bool   `json:"is_incorporated_pt"`
	IsListedOnBursa       bool   `json:"is_listed_on_bursa"`
	VerifyShowFigures     bool   `json:"verify_show_figures"`
	IsSuspended           bool   `json:"is_suspended"`
	SuspensionReason      string `json:"suspension_reason,omitempty"`
}

func ToSmeDTO(s gen.Sme) SmeDTO {
	var score int16
	if s.DigitalReadinessScore.Valid {
		score = s.DigitalReadinessScore.Int16
	}
	var reason string
	if s.SuspensionReason.Valid {
		reason = s.SuspensionReason.String
	}
	return SmeDTO{
		ID:                    uuidToString(s.ID),
		OwnerID:               uuidToString(s.OwnerID),
		BusinessName:          s.BusinessName,
		Slug:                  s.Slug,
		Sector:                s.Sector,
		Description:           s.Description,
		IsIncorporatedPt:      s.IsIncorporatedPt,
		DigitalReadinessScore: score,
		IsListedOnBursa:       s.IsListedOnBursa,
		VerifyShowFigures:     s.VerifyShowFigures,
		AiInterval:            string(s.AiInterval),
		IsSuspended:           s.IsSuspended,
		SuspensionReason:      reason,
	}
}

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

type UpdateProfileInput struct {
	BusinessName      string `json:"business_name"`
	Sector            string `json:"sector"`
	Description       string `json:"description"`
	IsIncorporatedPt  bool   `json:"is_incorporated_pt"`
	VerifyShowFigures bool   `json:"verify_show_figures"`
}

type DocumentItem struct {
	ID          string     `json:"id"`
	SmeID       string     `json:"sme_id"`
	DocType     string     `json:"doc_type"`
	StorageKey  string     `json:"storage_key"`
	Status      string     `json:"status"`
	ReviewNote  *string    `json:"review_note,omitempty"`
	ReviewedBy  *string    `json:"reviewed_by,omitempty"`
	ReviewedAt  *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	DownloadURL string     `json:"download_url,omitempty"`
}

func (s *Service) ListMySMEs(ctx context.Context, ownerID pgtype.UUID) ([]SmeDTO, error) {
	queries := gen.New(s.pool)
	rows, err := queries.ListSMEsByOwnerID(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	res := make([]SmeDTO, len(rows))
	for i, r := range rows {
		res[i] = ToSmeDTO(r)
	}
	return res, nil
}

func (s *Service) CreateMySME(ctx context.Context, ownerID pgtype.UUID, in CreateSMEInput) (*SmeDTO, error) {
	name := strings.TrimSpace(in.BusinessName)
	if name == "" {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Nama bisnis wajib diisi", "")
	}
	sector := strings.TrimSpace(in.Sector)
	if sector == "" {
		sector = "Umum"
	}
	slug := generateSlug(name)
	queries := gen.New(s.pool)
	sme, err := queries.CreateSME(ctx, gen.CreateSMEParams{
		OwnerID:          ownerID,
		BusinessName:     name,
		Slug:             slug,
		Sector:           sector,
		Description:      strings.TrimSpace(in.Description),
		IsIncorporatedPt: in.IsIncorporatedPt,
		AiInterval:       gen.AiScheduleInterval14Days,
		NextAiAnalysisAt: pgtype.Timestamptz{Time: time.Now().Add(14 * 24 * time.Hour), Valid: true},
	})
	if err != nil && strings.Contains(err.Error(), "smes_slug_key") {

		slug = generateSlug(name)
		sme, err = queries.CreateSME(ctx, gen.CreateSMEParams{
			OwnerID:          ownerID,
			BusinessName:     name,
			Slug:             slug,
			Sector:           sector,
			Description:      strings.TrimSpace(in.Description),
			IsIncorporatedPt: in.IsIncorporatedPt,
			AiInterval:       gen.AiScheduleInterval14Days,
			NextAiAnalysisAt: pgtype.Timestamptz{Time: time.Now().Add(14 * 24 * time.Hour), Valid: true},
		})
	}
	if err != nil {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Gagal mendaftarkan bisnis: "+err.Error(), "")
	}

	if s.pool != nil {
		_, _ = s.pool.Exec(ctx, "UPDATE users SET role = 'sme_owner' WHERE id = $1 AND role = 'investor'", ownerID)
	}

	dto := ToSmeDTO(sme)
	return &dto, nil
}

func generateSlug(name string) string {
	clean := strings.ToLower(strings.TrimSpace(name))
	slug := slugRegex.ReplaceAllString(clean, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "usaha"
	}
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%s-%x", slug, b)
}

func (s *Service) GetProfile(ctx context.Context, smeID pgtype.UUID) (*gen.Sme, error) {
	queries := gen.New(s.pool)
	sme, err := queries.GetSMEByID(ctx, smeID)
	if err != nil {
		return nil, apperr.NotFound(apperr.CodeNotFound, "Profil UMKM tidak ditemukan", "")
	}
	return &sme, nil
}

func (s *Service) UpdateProfile(ctx context.Context, smeID pgtype.UUID, in UpdateProfileInput) (*gen.Sme, error) {
	if strings.TrimSpace(in.BusinessName) == "" {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Nama bisnis wajib diisi", "")
	}
	if strings.TrimSpace(in.Sector) == "" {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Sektor bisnis wajib diisi", "")
	}

	queries := gen.New(s.pool)
	sme, err := queries.UpdateSMEProfile(ctx, gen.UpdateSMEProfileParams{
		ID:                smeID,
		BusinessName:      strings.TrimSpace(in.BusinessName),
		Sector:            strings.TrimSpace(in.Sector),
		Description:       strings.TrimSpace(in.Description),
		IsIncorporatedPt:  in.IsIncorporatedPt,
		VerifyShowFigures: in.VerifyShowFigures,
	})
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("Gagal memperbarui profil UMKM: %v", err))
	}
	return &sme, nil
}

func (s *Service) ListDocuments(ctx context.Context, smeID pgtype.UUID) ([]DocumentItem, error) {
	queries := gen.New(s.pool)
	docs, err := queries.GetSMEDocuments(ctx, smeID)
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("Gagal mengambil dokumen UMKM: %v", err))
	}

	res := make([]DocumentItem, 0, len(docs))
	for _, doc := range docs {
		item := s.mapDocItem(ctx, doc)
		res = append(res, item)
	}
	return res, nil
}

func (s *Service) UploadDocument(ctx context.Context, smeID pgtype.UUID, docType string, fileBytes []byte) (*DocumentItem, error) {
	validDocType, valErr := validateDocType(docType)
	if valErr != nil {
		return nil, valErr
	}
	mimeType, ext, err := detectDocMagicBytes(fileBytes)
	if err != nil {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, err.Error(), "Format harus PDF, JPEG, PNG, atau WebP")
	}

	smeIDStr := uuidToString(smeID)
	storageKey := fmt.Sprintf("documents/%s/%s_%d%s", smeIDStr, validDocType, time.Now().UnixNano(), ext)

	if putErr := s.store.Put(ctx, storageKey, bytes.NewReader(fileBytes), int64(len(fileBytes)), mimeType); putErr != nil {
		return nil, apperr.Internal(fmt.Sprintf("Gagal menyimpan dokumen: %v", putErr))
	}

	queries := gen.New(s.pool)
	doc, err := queries.UpsertSMEDocument(ctx, gen.UpsertSMEDocumentParams{
		SmeID:      smeID,
		DocType:    validDocType,
		StorageKey: storageKey,
	})
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("Gagal mencatat dokumen: %v", err))
	}

	item := s.mapDocItem(ctx, doc)
	return &item, nil
}

func validateDocType(dt string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(dt)) {
	case "nib", "ktp_owner", "npwp", "sk_kemenkumham":
		return strings.ToLower(strings.TrimSpace(dt)), nil
	default:
		return "", apperr.BadRequest(apperr.CodeBadRequest, "Tipe dokumen tidak didukung", "Tipe harus nib, ktp_owner, npwp, atau sk_kemenkumham")
	}
}

func (s *Service) mapDocItem(ctx context.Context, doc gen.SmeDocument) DocumentItem {
	item := DocumentItem{
		ID:         uuidToString(doc.ID),
		SmeID:      uuidToString(doc.SmeID),
		DocType:    doc.DocType,
		StorageKey: doc.StorageKey,
		Status:     string(doc.Status),
		CreatedAt:  doc.CreatedAt.Time,
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
	if s.store != nil && doc.StorageKey != "" {
		if url, err := s.store.SignedURL(ctx, doc.StorageKey, 5*time.Minute); err == nil {
			item.DownloadURL = url
		}
	}
	return item
}

func detectDocMagicBytes(data []byte) (string, string, error) {
	if len(data) < 4 {
		return "", "", fmt.Errorf("ukuran file terlalu kecil")
	}
	if bytes.HasPrefix(data, []byte("%PDF-")) {
		return "application/pdf", ".pdf", nil
	}
	if len(data) >= 3 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF {
		return "image/jpeg", ".jpg", nil
	}
	if len(data) >= 8 && bytes.Equal(data[:8], []byte("\x89PNG\r\n\x1a\n")) {
		return "image/png", ".png", nil
	}
	if len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP" {
		return "image/webp", ".webp", nil
	}
	return "", "", fmt.Errorf("format file tidak didukung")
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	src := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", src[0:4], src[4:6], src[6:8], src[8:10], src[10:16])
}
