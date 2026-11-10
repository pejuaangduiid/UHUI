package bursa

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

var nonAlphaNum = regexp.MustCompile(`[^a-z0-9]+`)

type CampaignService struct {
	q *gen.Queries
}

func NewCampaignService(_ *pgxpool.Pool, q *gen.Queries) *CampaignService {
	return &CampaignService{q: q}
}

type CreateCampaignReq struct {
	ClosesAt          time.Time `json:"closes_at"`
	Title             string    `json:"title"`
	Scheme            string    `json:"scheme"`
	TargetAmountIDR   int64     `json:"target_amount_idr"`
	MinInvestmentIDR  int64     `json:"min_investment_idr"`
	ReturnShareBps    int16     `json:"return_share_bps"`
	TermMonths        int16     `json:"term_months"`
	SCFPartnerID      *string   `json:"scf_partner_id,omitempty"`
	OJKRegisteredCode *string   `json:"ojk_registered_code,omitempty"`
}

func (s *CampaignService) validateCreateReq(ctx context.Context, smeID uuid.UUID, req CreateCampaignReq) error {
	if req.TargetAmountIDR < 1_000_000 || req.TargetAmountIDR > 10_000_000_000 {
		return apperr.BadRequest("INVALID_TARGET_AMOUNT", "Target dana harus antara Rp 1.000.000 dan Rp 10.000.000.000", "Periksa target_amount_idr")
	}
	if req.MinInvestmentIDR < 50_000 || req.MinInvestmentIDR > req.TargetAmountIDR {
		return apperr.BadRequest("INVALID_MIN_INVESTMENT", "Minimal investasi harus minimal Rp 50.000 dan tidak melebihi target dana", "Periksa min_investment_idr")
	}
	if req.ReturnShareBps < 1 || req.ReturnShareBps > 5000 {
		return apperr.BadRequest("INVALID_RETURN_SHARE", "Bagi hasil/dividen harus antara 1 dan 5000 bps (0.01% - 50.00%)", "Periksa return_share_bps")
	}
	if req.TermMonths < 1 || req.TermMonths > 60 {
		return apperr.BadRequest("INVALID_TERM", "Tenor kampanye harus antara 1 dan 60 bulan", "Periksa term_months")
	}
	if req.ClosesAt.Before(time.Now().Add(24 * time.Hour)) {
		return apperr.BadRequest("INVALID_CLOSES_AT", "Batas penutupan kampanye minimal 24 jam dari sekarang", "Periksa closes_at")
	}
	return s.checkSmeEligibility(ctx, smeID, req.Scheme)
}

func (s *CampaignService) checkSmeEligibility(ctx context.Context, smeID uuid.UUID, scheme string) error {
	sme, err := s.q.GetSMEByID(ctx, pgtype.UUID{Bytes: smeID, Valid: true})
	if err != nil {
		return apperr.NotFound("SME_NOT_FOUND", "Data UMKM tidak ditemukan", "")
	}
	if sme.IsSuspended {
		return apperr.Forbidden("SME_SUSPENDED", "UMKM sedang ditangguhkan oleh Admin", "Tidak dapat membuat kampanye bursa saat status bisnis ditangguhkan")
	}
	if scheme == string(gen.FundingSchemeMicroEquity) && !sme.IsIncorporatedPt {
		return apperr.BadRequest("PT_REQUIRED", "Skema micro_equity hanya diperbolehkan untuk UMKM berbentuk PT", "Gunakan skema revenue_sharing atau ubah status PT")
	}
	return s.checkLegalDocumentsVerified(ctx, smeID, scheme, sme.IsIncorporatedPt)
}

func (s *CampaignService) checkLegalDocumentsVerified(ctx context.Context, smeID uuid.UUID, scheme string, isPT bool) error {
	docs, err := s.q.GetSMEDocuments(ctx, pgtype.UUID{Bytes: smeID, Valid: true})
	if err != nil {
		return apperr.Internal("Gagal memeriksa dokumen legalitas UMKM: " + err.Error())
	}

	verifiedDocs := make(map[string]bool)
	for _, d := range docs {
		if d.Status == gen.ReviewStatusVerified {
			verifiedDocs[d.DocType] = true
		}
	}

	if !verifiedDocs["nib"] {
		return apperr.Forbidden("LEGAL_DOC_UNVERIFIED", "Dokumen NIB belum diverifikasi oleh Admin. Seluruh dokumen legalitas wajib disetujui kurator sebelum usaha Anda dapat menjual saham di Bursa Saham.", "Silakan ajukan NIB pada menu Dokumen Legal dan tunggu verifikasi kurator.")
	}

	if !verifiedDocs["npwp"] {
		return apperr.Forbidden("LEGAL_DOC_UNVERIFIED", "Dokumen NPWP belum diverifikasi oleh Admin. Usaha Anda belum memenuhi syarat kurasi legalitas untuk menjual saham di Bursa Saham.", "Silakan ajukan NPWP pada menu Dokumen Legal dan tunggu verifikasi kurator.")
	}

	if (scheme == string(gen.FundingSchemeMicroEquity) || isPT) && (!verifiedDocs["pt_deed"] && !verifiedDocs["sk_kemenkumham"]) {
		return apperr.Forbidden("LEGAL_DOC_UNVERIFIED", "Dokumen Akta Pendirian PT belum diverifikasi oleh Admin. Penjualan saham/ekuitas mewajibkan akta perseroan yang telah disetujui kurator.", "Silakan ajukan Akta PT pada menu Dokumen Legal dan tunggu verifikasi kurator.")
	}

	return nil
}

func (s *CampaignService) CreateCampaign(ctx context.Context, smeID uuid.UUID, req CreateCampaignReq) (*CampaignDTO, error) {
	if err := s.validateCreateReq(ctx, smeID, req); err != nil {
		return nil, err
	}

	exists, err := s.q.CheckActiveCampaignExists(ctx, gen.CheckActiveCampaignExistsParams{
		SmeID: pgtype.UUID{Bytes: smeID, Valid: true},
		ID:    pgtype.UUID{},
	})
	if err != nil {
		return nil, apperr.Internal("Gagal memeriksa kampanye aktif: " + err.Error())
	}
	if exists {
		return nil, apperr.Conflict("CAMPAIGN_ACTIVE", "UMKM sudah memiliki kampanye aktif atau dalam peninjauan", "Selesaikan kampanye berjalan terlebih dahulu")
	}

	slug := generateCampaignSlug(req.Title)
	var scfPartnerUUID pgtype.UUID
	if req.SCFPartnerID != nil && *req.SCFPartnerID != "" {
		if u, err := uuid.Parse(*req.SCFPartnerID); err == nil {
			scfPartnerUUID = pgtype.UUID{Bytes: u, Valid: true}
		}
	}
	var ojkCodeText pgtype.Text
	if req.OJKRegisteredCode != nil && *req.OJKRegisteredCode != "" {
		ojkCodeText = pgtype.Text{String: *req.OJKRegisteredCode, Valid: true}
	}
	camp, err := s.q.CreateCampaign(ctx, gen.CreateCampaignParams{
		SmeID:             pgtype.UUID{Bytes: smeID, Valid: true},
		Slug:              slug,
		Title:             req.Title,
		Scheme:            gen.FundingScheme(req.Scheme),
		TargetAmountIdr:   req.TargetAmountIDR,
		MinInvestmentIdr:  req.MinInvestmentIDR,
		ReturnShareBps:    req.ReturnShareBps,
		TermMonths:        req.TermMonths,
		ClosesAt:          pgtype.Timestamptz{Time: req.ClosesAt, Valid: true},
		ScfPartnerID:      scfPartnerUUID,
		OjkRegisteredCode: ojkCodeText,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal membuat kampanye: " + err.Error())
	}
	return toCampaignDTO(camp), nil
}

func (s *CampaignService) SubmitCampaign(ctx context.Context, smeID, campaignID uuid.UUID) (*CampaignDTO, error) {
	camp, err := s.q.GetCampaignByID(ctx, pgtype.UUID{Bytes: campaignID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("CAMPAIGN_NOT_FOUND", "Kampanye tidak ditemukan", "")
	}
	if camp.SmeID.Bytes != smeID {
		return nil, apperr.Forbidden("FORBIDDEN", "Bukan pemilik kampanye ini", "")
	}
	if !CanTransition(camp.Status, gen.CampaignStatusInReview, string(gen.UserRoleSmeOwner)) {
		return nil, apperr.BadRequest("INVALID_TRANSITION", "Hanya kampanye berstatus draft yang dapat diajukan review", "")
	}

	if eligErr := s.checkSmeEligibility(ctx, smeID, string(camp.Scheme)); eligErr != nil {
		return nil, eligErr
	}

	score, err := s.q.GetLatestReadinessScore(ctx, gen.GetLatestReadinessScoreParams{
		SmeID:  camp.SmeID,
		Scheme: camp.Scheme,
	})
	if err != nil || !score.ComputedAt.Valid {
		return nil, apperr.BadRequest("READINESS_SCORE_MISSING", "Skor kesiapan digital belum tersedia", "Jalankan evaluasi kesiapan digital terlebih dahulu")
	}
	if time.Since(score.ComputedAt.Time) > 14*24*time.Hour {
		return nil, apperr.BadRequest("READINESS_SCORE_STALE", "Skor kesiapan digital sudah kedaluwarsa (> 14 hari)", "Jalankan evaluasi ulang kesiapan digital")
	}
	if !score.GatePassed {
		return nil, apperr.BadRequest("READINESS_GATE_FAILED", "UMKM belum memenuhi syarat kelayakan (gate check)", "Perbaiki catatan kepatuhan Anda")
	}

	updated, err := s.q.SubmitCampaignForReview(ctx, gen.SubmitCampaignForReviewParams{
		ID:               camp.ID,
		ReadinessScoreID: score.ID,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal mengajukan kampanye: " + err.Error())
	}
	return toCampaignDTO(updated), nil
}

func (s *CampaignService) CancelCampaign(ctx context.Context, smeID, campaignID uuid.UUID) (*CampaignDTO, error) {
	camp, err := s.q.GetCampaignByID(ctx, pgtype.UUID{Bytes: campaignID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("CAMPAIGN_NOT_FOUND", "Kampanye tidak ditemukan", "")
	}
	if camp.SmeID.Bytes != smeID {
		return nil, apperr.Forbidden("FORBIDDEN", "Bukan pemilik kampanye ini", "")
	}
	if !CanTransition(camp.Status, gen.CampaignStatusCancelled, string(gen.UserRoleSmeOwner)) {
		return nil, apperr.BadRequest("INVALID_TRANSITION", "Kampanye tidak dapat dibatalkan pada status saat ini", "")
	}

	updated, err := s.q.UpdateCampaignStatus(ctx, gen.UpdateCampaignStatusParams{
		ID:     camp.ID,
		Status: gen.CampaignStatusCancelled,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal membatalkan kampanye: " + err.Error())
	}
	return toCampaignDTO(updated), nil
}

func (s *CampaignService) ListCampaignsBySME(ctx context.Context, smeID uuid.UUID) ([]CampaignDTO, error) {
	list, err := s.q.ListCampaignsBySME(ctx, pgtype.UUID{Bytes: smeID, Valid: true})
	if err != nil {
		return nil, apperr.Internal("Gagal mengambil daftar kampanye: " + err.Error())
	}
	res := make([]CampaignDTO, len(list))
	for i, c := range list {
		res[i] = *toCampaignDTO(c)
	}
	return res, nil
}

func (s *CampaignService) GetCampaignByID(ctx context.Context, id uuid.UUID) (*CampaignDTO, error) {
	camp, err := s.q.GetCampaignByID(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("CAMPAIGN_NOT_FOUND", "Kampanye tidak ditemukan", "")
	}
	return toCampaignDTO(camp), nil
}

func generateCampaignSlug(title string) string {
	clean := strings.ToLower(title)
	clean = nonAlphaNum.ReplaceAllString(clean, "-")
	clean = strings.Trim(clean, "-")
	if len(clean) > 40 {
		clean = clean[:40]
	}
	b := make([]byte, 3)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%s-%s", clean, hex.EncodeToString(b))
}

func toCampaignDTO(c gen.BursaCampaign) *CampaignDTO {
	dto := &CampaignDTO{
		ID:               uuid.UUID(c.ID.Bytes).String(),
		SMEID:            uuid.UUID(c.SmeID.Bytes).String(),
		Slug:             c.Slug,
		Title:            c.Title,
		Scheme:           string(c.Scheme),
		TargetAmountIDR:  c.TargetAmountIdr,
		RaisedAmountIDR:  c.RaisedAmountIdr,
		MinInvestmentIDR: c.MinInvestmentIdr,
		ReturnShareBps:   c.ReturnShareBps,
		TermMonths:       c.TermMonths,
		Status:           string(c.Status),
		CreatedAt:        c.CreatedAt.Time,
		ClosesAt:         c.ClosesAt.Time,
	}
	if c.ReadinessScoreID.Valid {
		idStr := uuid.UUID(c.ReadinessScoreID.Bytes).String()
		dto.ReadinessScoreID = &idStr
	}
	if c.ReviewedBy.Valid {
		idStr := uuid.UUID(c.ReviewedBy.Bytes).String()
		dto.ReviewedBy = &idStr
	}
	if c.ReviewNote.Valid {
		dto.ReviewNote = &c.ReviewNote.String
	}
	if c.FundedAt.Valid {
		dto.FundedAt = &c.FundedAt.Time
	}
	if c.ScfPartnerID.Valid {
		idStr := uuid.UUID(c.ScfPartnerID.Bytes).String()
		dto.SCFPartnerID = &idStr
	}
	if c.OjkRegisteredCode.Valid && c.OjkRegisteredCode.String != "" {
		dto.OJKRegisteredCode = &c.OjkRegisteredCode.String
	}
	return dto
}
