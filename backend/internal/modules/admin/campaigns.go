package admin

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

type CampaignQueueItem struct {
	CreatedAt        time.Time `json:"created_at"`
	ClosesAt         time.Time `json:"closes_at"`
	ID               string    `json:"id"`
	SmeID            string    `json:"sme_id"`
	BusinessName     string    `json:"business_name"`
	Sector           string    `json:"sector"`
	OwnerName        string    `json:"owner_name"`
	OwnerEmail       string    `json:"owner_email"`
	Slug             string    `json:"slug"`
	Title            string    `json:"title"`
	Scheme           string    `json:"scheme"`
	Status           string    `json:"status"`
	TargetAmountIDR  int64     `json:"target_amount_idr"`
	MinInvestmentIDR int64     `json:"min_investment_idr"`
	ReturnShareBps   int16     `json:"return_share_bps"`
	TermMonths       int16     `json:"term_months"`
}

func (s *Service) ListCampaignReviewQueue(ctx context.Context) ([]CampaignQueueItem, error) {
	queries := gen.New(s.pool)
	rows, err := queries.ListInReviewCampaigns(ctx)
	if err != nil {
		return nil, apperr.Internal(fmt.Sprintf("Gagal memuat antrean kampanye: %v", err))
	}

	res := make([]CampaignQueueItem, len(rows))
	for i, r := range rows {
		res[i] = CampaignQueueItem{
			ID:               uuidToString(r.ID),
			SmeID:            uuidToString(r.SmeID),
			BusinessName:     r.BusinessName,
			Sector:           r.Sector,
			OwnerName:        r.OwnerName,
			OwnerEmail:       r.OwnerEmail,
			Slug:             r.Slug,
			Title:            r.Title,
			Scheme:           string(r.Scheme),
			TargetAmountIDR:  r.TargetAmountIdr,
			MinInvestmentIDR: r.MinInvestmentIdr,
			ReturnShareBps:   r.ReturnShareBps,
			TermMonths:       r.TermMonths,
			Status:           string(r.Status),
			ClosesAt:         r.ClosesAt.Time,
			CreatedAt:        r.CreatedAt.Time,
		}
	}
	return res, nil
}

func (s *Service) ReviewCampaign(ctx context.Context, campID, reviewerID pgtype.UUID, in ReviewInput) error {
	status := strings.ToLower(strings.TrimSpace(in.Status))
	if status != "approved" && status != "rejected" {
		return apperr.BadRequest(apperr.CodeBadRequest, "Status review kampanye harus approved atau rejected", "")
	}

	note := strings.TrimSpace(in.ReviewNote)
	if status == "rejected" && note == "" {
		return apperr.BadRequest(apperr.CodeBadRequest, "Catatan wajib diisi saat menolak kampanye", "")
	}

	var newStatus gen.CampaignStatus
	if status == "approved" {
		newStatus = gen.CampaignStatusOpen
	} else {
		newStatus = gen.CampaignStatusCancelled
	}

	var noteText pgtype.Text
	if note != "" {
		_ = noteText.Scan(note)
	}

	queries := gen.New(s.pool)
	_, err := queries.UpdateCampaignStatus(ctx, gen.UpdateCampaignStatusParams{
		ID:         campID,
		Status:     newStatus,
		ReviewNote: noteText,
		ReviewedBy: reviewerID,
	})
	if err != nil {
		return apperr.Internal(fmt.Sprintf("Gagal memperbarui status kampanye: %v", err))
	}
	return nil
}
