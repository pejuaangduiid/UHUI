package bursa

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

func RegisterPublicHandlers(api huma.API, q *gen.Queries) {
	registerListPublicCampaigns(api, q)
	registerGetPublicCampaignBySlug(api, q)
}

func registerListPublicCampaigns(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaListCampaigns",
		Method:      http.MethodGet,
		Path:        "/api/v1/bursa",
		Summary:     "Public catalog of open investment campaigns",
		Tags:        []string{"Bursa"},
	}, func(ctx context.Context, in *struct {
		Scheme string `query:"scheme"`
		Sector string `query:"sector"`
		Limit  int32  `query:"limit"`
	}) (*struct{ Body []PublicCampaignDTO }, error) {
		limit := in.Limit
		if limit <= 0 || limit > 100 {
			limit = 50
		}
		cacheKey := fmt.Sprintf("%s:%s:%d", in.Scheme, in.Sector, limit)
		if cached, ok := globalPublicCache.getList(cacheKey); ok {
			return &struct{ Body []PublicCampaignDTO }{Body: cached}, nil
		}
		rows, err := q.ListOpenCampaigns(ctx, gen.ListOpenCampaignsParams{
			Column1: in.Scheme,
			Column2: in.Sector,
			Limit:   limit,
		})
		if err != nil {
			return nil, mapAppError(apperr.Internal("Gagal memuat bursa: " + err.Error()))
		}

		res := make([]PublicCampaignDTO, len(rows))
		for i, r := range rows {
			var score int16
			if r.LatestReadinessScore.Valid {
				score = r.LatestReadinessScore.Int16
			}
			res[i] = PublicCampaignDTO{
				ID:                   uuid.UUID(r.ID.Bytes).String(),
				Slug:                 r.Slug,
				Title:                r.Title,
				Scheme:               string(r.Scheme),
				TargetAmountIDR:      r.TargetAmountIdr,
				RaisedAmountIDR:      r.RaisedAmountIdr,
				MinInvestmentIDR:     r.MinInvestmentIdr,
				ReturnShareBps:       r.ReturnShareBps,
				TermMonths:           r.TermMonths,
				Status:               string(r.Status),
				ClosesAt:             r.ClosesAt.Time,
				BusinessName:         r.BusinessName,
				Sector:               r.Sector,
				LatestReadinessScore: score,
				IsIncorporatedPT:     r.IsIncorporatedPt,
			}
		}
		globalPublicCache.setList(cacheKey, res, 45*time.Second)
		return &struct{ Body []PublicCampaignDTO }{Body: res}, nil
	})
}

func registerGetPublicCampaignBySlug(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaGetCampaignBySlug",
		Method:      http.MethodGet,
		Path:        "/api/v1/bursa/{slug}",
		Summary:     "Public campaign detail by slug",
		Tags:        []string{"Bursa"},
	}, func(ctx context.Context, in *struct {
		Slug string `path:"slug"`
	}) (*struct{ Body *PublicCampaignDetailDTO }, error) {
		if cached, ok := globalPublicCache.getDetail(in.Slug); ok {
			return &struct{ Body *PublicCampaignDetailDTO }{Body: cached}, nil
		}
		r, err := q.GetCampaignBySlug(ctx, in.Slug)
		if err != nil {
			return nil, huma.NewError(http.StatusNotFound, "Kampanye tidak ditemukan")
		}

		var score int16
		if r.LatestReadinessScore.Valid {
			score = r.LatestReadinessScore.Int16
		}

		detail := &PublicCampaignDetailDTO{
			PublicCampaignDTO: PublicCampaignDTO{
				ID:                   uuid.UUID(r.ID.Bytes).String(),
				Slug:                 r.Slug,
				Title:                r.Title,
				Scheme:               string(r.Scheme),
				TargetAmountIDR:      r.TargetAmountIdr,
				RaisedAmountIDR:      r.RaisedAmountIdr,
				MinInvestmentIDR:     r.MinInvestmentIdr,
				ReturnShareBps:       r.ReturnShareBps,
				TermMonths:           r.TermMonths,
				Status:               string(r.Status),
				ClosesAt:             r.ClosesAt.Time,
				BusinessName:         r.BusinessName,
				Sector:               r.Sector,
				IsIncorporatedPT:     r.IsIncorporatedPt,
				LatestReadinessScore: score,
			},
			Description: r.SmeDescription,
		}
		globalPublicCache.setDetail(in.Slug, detail, 45*time.Second)
		return &struct{ Body *PublicCampaignDetailDTO }{Body: detail}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
