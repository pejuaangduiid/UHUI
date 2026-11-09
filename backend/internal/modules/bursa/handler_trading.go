package bursa

import (
	"context"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
	"github.com/uhui/backend/internal/modules/community"
	"github.com/uhui/backend/internal/payment"
)

type ValuationPointDTO struct {
	Timestamp time.Time `json:"timestamp"`
	PriceIDR  int64     `json:"price_idr"`
	VolumeIDR int64     `json:"volume_idr"`
}

type ValuationHistoryDTO struct {
	CampaignSlug    string              `json:"campaign_slug"`
	BusinessName    string              `json:"business_name"`
	Points          []ValuationPointDTO `json:"points"`
	CurrentPriceIDR int64               `json:"current_price_idr"`
	TargetAmountIDR int64               `json:"target_amount_idr"`
	RaisedAmountIDR int64               `json:"raised_amount_idr"`
	ValuationIDR    int64               `json:"valuation_idr"`
	ChangeBps       int32               `json:"change_bps"`
}

type BoardroomAccessDTO struct {
	SmeID        string `json:"sme_id"`
	BusinessName string `json:"business_name"`
	Message      string `json:"message"`
	CanAccess    bool   `json:"can_access"`
	IsOwner      bool   `json:"is_owner"`
	IsInvestor   bool   `json:"is_investor"`
}

type SellOrderDTO struct {
	ExecutedAt time.Time `json:"executed_at"`
	OrderID    string    `json:"order_id"`
	CampaignID string    `json:"campaign_id"`
	Status     string    `json:"status"`
	Message    string    `json:"message"`
	AmountIDR  int64     `json:"amount_idr"`
}

func RegisterTradingHandlers(api huma.API, q *gen.Queries, pool *pgxpool.Pool, pay *payment.SimulatedProvider) {
	registerGetValuationHistory(api, q)
	registerGetBoardroomAccess(api, q)
	registerSellShares(api, q, pool, pay)
}

func registerGetValuationHistory(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaGetValuationHistory",
		Method:      http.MethodGet,
		Path:        "/api/v1/bursa/{slug}/valuation-history",
		Summary:     "Get historical asset valuation and trading chart points",
		Tags:        []string{"Bursa"},
	}, func(ctx context.Context, in *struct {
		Slug string `path:"slug"`
	}) (*struct{ Body *ValuationHistoryDTO }, error) {
		camp, err := q.GetCampaignBySlug(ctx, in.Slug)
		if err != nil {
			return nil, huma.NewError(http.StatusNotFound, "Kampanye tidak ditemukan")
		}

		basePrice := camp.MinInvestmentIdr
		if basePrice <= 0 {
			basePrice = 100000
		}
		valuation := camp.TargetAmountIdr * 3
		if valuation <= 0 {
			valuation = 300000000
		}

		points := generateValuationCurve(basePrice)
		currPrice := points[11].PriceIDR

		return &struct{ Body *ValuationHistoryDTO }{
			Body: &ValuationHistoryDTO{
				CampaignSlug:    camp.Slug,
				BusinessName:    camp.BusinessName,
				CurrentPriceIDR: currPrice,
				TargetAmountIDR: camp.TargetAmountIdr,
				RaisedAmountIDR: camp.RaisedAmountIdr,
				ValuationIDR:    valuation,
				ChangeBps:       600,
				Points:          points,
			},
		}, nil
	})
}

func generateValuationCurve(basePrice int64) []ValuationPointDTO {
	now := time.Now().UTC()
	points := make([]ValuationPointDTO, 12)
	offsets := []int64{-12, -9, -11, -8, -6, -4, -5, -2, 0, 2, 4, 6}
	volOffsets := []int64{10, 15, 8, 25, 18, 30, 22, 40, 35, 50, 45, 60}
	for i := 0; i < 12; i++ {
		t := now.Add(-time.Duration(12-i) * 2 * time.Hour)
		priceDelta := (basePrice * offsets[i]) / 100
		p := basePrice + priceDelta
		if p <= 0 {
			p = basePrice
		}
		points[i] = ValuationPointDTO{
			Timestamp: t,
			PriceIDR:  p,
			VolumeIDR: volOffsets[i] * 1000000,
		}
	}
	return points
}

func registerGetBoardroomAccess(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaGetBoardroomAccess",
		Method:      http.MethodGet,
		Path:        "/api/v1/bursa/{slug}/boardroom-access",
		Summary:     "Check if user has boardroom shareholder access",
		Tags:        []string{"Bursa"},
	}, func(ctx context.Context, in *struct {
		Slug string `path:"slug"`
	}) (*struct{ Body *BoardroomAccessDTO }, error) {
		camp, err := q.GetCampaignBySlug(ctx, in.Slug)
		if err != nil {
			return nil, huma.NewError(http.StatusNotFound, "Kampanye tidak ditemukan")
		}

		p, _ := middleware.GetPrincipal(ctx)
		access, err := evalBoardroomAccess(ctx, q, camp, p)
		if err != nil {
			return nil, err
		}
		return &struct{ Body *BoardroomAccessDTO }{Body: access}, nil
	})
}

func hasPortfolioShareForCampaign(ctx context.Context, q *gen.Queries, userUUID uuid.UUID, slug string) bool {
	portfolio, err := q.ListInvestorPortfolio(ctx, pgtype.UUID{Bytes: userUUID, Valid: true})
	if err != nil {
		return false
	}
	for _, item := range portfolio {
		if item.CampaignSlug == slug && item.Status == gen.InvestmentStatusConfirmed && item.AmountIdr > 0 {
			return true
		}
	}
	return false
}

func evalBoardroomAccess(ctx context.Context, q *gen.Queries, camp gen.GetCampaignBySlugRow, p *middleware.Principal) (*BoardroomAccessDTO, error) {
	smeUUID := uuid.UUID(camp.SmeID.Bytes)
	if p == nil {
		return &BoardroomAccessDTO{
			CanAccess:    false,
			IsOwner:      false,
			IsInvestor:   false,
			SmeID:        smeUUID.String(),
			BusinessName: camp.BusinessName,
			Message:      "Silakan masuk untuk mengakses Ruang Rapat Pemegang Saham.",
		}, nil
	}

	userUUID, err := uuid.Parse(p.UserID)
	if err != nil {
		return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
	}

	canAccess, err := community.CanAccessBoardroom(ctx, q, smeUUID, userUUID)
	if err != nil {
		return nil, huma.NewError(http.StatusInternalServerError, "Gagal memeriksa izin akses: "+err.Error())
	}

	if !canAccess && hasPortfolioShareForCampaign(ctx, q, userUUID, camp.Slug) {
		canAccess = true
	}

	isOwner, isInvestor := false, false
	if canAccess {
		sme, err := q.GetSMEByID(ctx, camp.SmeID)
		if err == nil && sme.OwnerID.Valid && uuid.UUID(sme.OwnerID.Bytes) == userUUID {
			isOwner = true
		} else {
			isInvestor = true
		}
	}

	msg := "Akses terverifikasi. Selamat datang di Ruang Rapat Pemegang Saham."
	if !canAccess {
		msg = "Ruang Rapat Pemegang Saham bersifat privat. Anda harus memiliki porsi saham terkonfirmasi pada " + camp.BusinessName + " untuk membuka agenda rapat dan diskusi internal."
	}

	return &BoardroomAccessDTO{
		CanAccess:    canAccess,
		IsOwner:      isOwner,
		IsInvestor:   isInvestor,
		SmeID:        smeUUID.String(),
		BusinessName: camp.BusinessName,
		Message:      msg,
	}, nil
}

type invRow struct {
	id        uuid.UUID
	amountIDR int64
}

func deductInvestmentRows(ctx context.Context, tx pgx.Tx, investments []invRow, amountIDR int64) error {
	remaining := amountIDR
	for _, item := range investments {
		if remaining <= 0 {
			break
		}
		if item.amountIDR <= remaining {
			remaining -= item.amountIDR
			if _, err := tx.Exec(ctx, "UPDATE investments SET status = 'refunded' WHERE id = $1", item.id); err != nil {
				return err
			}
		} else {
			newAmt := item.amountIDR - remaining
			remaining = 0
			if _, err := tx.Exec(ctx, "UPDATE investments SET amount_idr = $1 WHERE id = $2", newAmt, item.id); err != nil {
				return err
			}
		}
	}
	return nil
}

func executeShareLiquidation(ctx context.Context, pool *pgxpool.Pool, campUUID, userUUID uuid.UUID, amountIDR int64) error {
	if pool == nil {
		return nil
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	rows, err := tx.Query(ctx, `
		SELECT id, amount_idr
		FROM investments
		WHERE investor_id = $1 AND campaign_id = $2 AND status = 'confirmed'
		ORDER BY created_at ASC
		FOR UPDATE
	`, userUUID, campUUID)
	if err != nil {
		return err
	}
	defer rows.Close()

	var investments []invRow
	var totalConfirmed int64
	for rows.Next() {
		var r invRow
		if err := rows.Scan(&r.id, &r.amountIDR); err != nil {
			return err
		}
		investments = append(investments, r)
		totalConfirmed += r.amountIDR
	}
	rows.Close()

	if totalConfirmed < amountIDR {
		return huma.NewError(http.StatusBadRequest, "Saldo kepemilikan saham Anda tidak mencukupi untuk order jual ini")
	}

	if err := deductInvestmentRows(ctx, tx, investments, amountIDR); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, "UPDATE bursa_campaigns SET raised_amount_idr = GREATEST(0, raised_amount_idr - $1) WHERE id = $2", amountIDR, campUUID); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func registerSellShares(api huma.API, q *gen.Queries, pool *pgxpool.Pool, pay *payment.SimulatedProvider) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaSellShares",
		Method:      http.MethodPost,
		Path:        "/api/v1/campaigns/{id}/sell",
		Summary:     "Liquidate or sell simulated shares",
		Tags:        []string{"Investments"},
	}, func(ctx context.Context, in *struct {
		ID   string `path:"id"`
		Body struct {
			AmountIDR int64 `json:"amount_idr"`
		}
	}) (*struct{ Body *SellOrderDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		campUUID, err := resolveCampaignUUID(ctx, q, in.ID)
		if err != nil {
			return nil, err
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}
		if in.Body.AmountIDR <= 0 {
			return nil, huma.NewError(http.StatusBadRequest, "Nilai pencairan harus lebih dari 0")
		}

		if err := executeShareLiquidation(ctx, pool, campUUID, userUUID, in.Body.AmountIDR); err != nil {
			return nil, err
		}

		if pay != nil {
			pay.TopUpContext(ctx, p.UserID, in.Body.AmountIDR)
		}

		return &struct{ Body *SellOrderDTO }{
			Body: &SellOrderDTO{
				OrderID:    uuid.New().String(),
				CampaignID: campUUID.String(),
				AmountIDR:  in.Body.AmountIDR,
				Status:     "executed",
				ExecutedAt: time.Now().UTC(),
				Message:    "Order jual berhasil dieksekusi. Dana hasil likuidasi telah dialokasikan ke saldo dompet Anda.",
			},
		}, nil
	})
}
