package bursa

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/money"
)

type DistributionService struct {
	pool *pgxpool.Pool
	q    *gen.Queries
}

func NewDistributionService(pool *pgxpool.Pool, q *gen.Queries) *DistributionService {
	return &DistributionService{pool: pool, q: q}
}

type DistributeProfitReq struct {
	ReportSnapshotID *uuid.UUID `json:"report_snapshot_id,omitempty"`
	PeriodStart      time.Time  `json:"period_start"`
	PeriodEnd        time.Time  `json:"period_end"`
	CampaignID       uuid.UUID  `json:"campaign_id"`
	PoolIDR          int64      `json:"pool_idr"`
}

func (s *DistributionService) DistributeProfit(ctx context.Context, req DistributeProfitReq) (*ProfitDistributionDTO, error) {
	if req.PoolIDR <= 0 {
		return nil, apperr.BadRequest("INVALID_POOL_AMOUNT", "Nominal bagi hasil harus lebih besar dari 0", "")
	}
	if req.ReportSnapshotID == nil {
		return nil, apperr.BadRequest("REPORT_SNAPSHOT_REQUIRED", "ID snapshot laporan keuangan wajib disertakan", "")
	}

	camp, err := s.q.GetCampaignByID(ctx, pgtype.UUID{Bytes: req.CampaignID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("CAMPAIGN_NOT_FOUND", "Kampanye tidak ditemukan", "")
	}
	if camp.Status != gen.CampaignStatusFunded {
		return nil, apperr.BadRequest("CAMPAIGN_NOT_ELIGIBLE", "Distribusi hanya dapat dilakukan untuk kampanye yang telah terdanai", "")
	}

	investments, err := s.q.ListConfirmedInvestmentsByCampaign(ctx, camp.ID)
	if err != nil {
		return nil, apperr.Internal("Gagal mengambil daftar investor: " + err.Error())
	}
	if len(investments) == 0 {
		return nil, apperr.BadRequest("NO_INVESTORS", "Tidak ada investasi terkonfirmasi pada kampanye ini", "")
	}

	payouts, err := calculateProRataPayouts(req.PoolIDR, investments)
	if err != nil {
		return nil, err
	}

	return s.saveDistribution(ctx, req, payouts)
}

type investorPayout struct {
	investmentID pgtype.UUID
	amountIDR    int64
}

func calculateProRataPayouts(poolIDR int64, investments []gen.Investment) ([]investorPayout, error) {
	var totalRaised int64
	for _, inv := range investments {
		totalRaised += inv.AmountIdr
	}
	if totalRaised == 0 {
		return nil, apperr.BadRequest("ZERO_RAISED", "Total pendanaan tidak boleh 0", "")
	}

	payouts := make([]investorPayout, len(investments))
	var allocatedSum int64

	for i, inv := range investments {
		portion, err := money.MulDivFloor(poolIDR, inv.AmountIdr, totalRaised)
		if err != nil {
			return nil, apperr.Internal("Gagal menghitung proporsi bagi hasil: " + err.Error())
		}
		payouts[i] = investorPayout{
			investmentID: inv.ID,
			amountIDR:    portion,
		}
		allocatedSum += portion
	}

	remainder := poolIDR - allocatedSum
	if remainder > 0 && len(payouts) > 0 {
		payouts[0].amountIDR += remainder
	}

	return payouts, nil
}

func (s *DistributionService) saveDistribution(ctx context.Context, req DistributeProfitReq, payouts []investorPayout) (*ProfitDistributionDTO, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memulai transaksi: " + err.Error())
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.q.WithTx(tx)

	var snapUUID pgtype.UUID
	if req.ReportSnapshotID != nil {
		snapUUID = pgtype.UUID{Bytes: *req.ReportSnapshotID, Valid: true}
	}

	dist, err := qtx.CreateProfitDistribution(ctx, gen.CreateProfitDistributionParams{
		CampaignID:       pgtype.UUID{Bytes: req.CampaignID, Valid: true},
		ReportSnapshotID: snapUUID,
		PeriodStart:      pgtype.Date{Time: req.PeriodStart, Valid: true},
		PeriodEnd:        pgtype.Date{Time: req.PeriodEnd, Valid: true},
		PoolIdr:          req.PoolIDR,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal mencatat distribusi: " + err.Error())
	}

	items := make([]DistributionItemDTO, len(payouts))
	for i, p := range payouts {
		item, err := qtx.CreateDistributionItem(ctx, gen.CreateDistributionItemParams{
			DistributionID: dist.ID,
			InvestmentID:   p.investmentID,
			AmountIdr:      p.amountIDR,
		})
		if err != nil {
			return nil, apperr.Internal("Gagal mencatat rincian dividen: " + err.Error())
		}
		items[i] = DistributionItemDTO{
			DistributionID: uuid.UUID(item.DistributionID.Bytes).String(),
			InvestmentID:   uuid.UUID(item.InvestmentID.Bytes).String(),
			AmountIDR:      item.AmountIdr,
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Internal("Gagal menyelesaikan distribusi: " + err.Error())
	}

	distID := uuid.UUID(dist.ID.Bytes).String()
	res := &ProfitDistributionDTO{
		ID:          distID,
		CampaignID:  uuid.UUID(dist.CampaignID.Bytes).String(),
		PoolIDR:     dist.PoolIdr,
		PeriodStart: dist.PeriodStart.Time,
		PeriodEnd:   dist.PeriodEnd.Time,
		CreatedAt:   dist.CreatedAt.Time,
		Items:       items,
	}
	if dist.ReportSnapshotID.Valid {
		idStr := uuid.UUID(dist.ReportSnapshotID.Bytes).String()
		res.ReportSnapshotID = &idStr
	}
	return res, nil
}

func (s *DistributionService) ListDistributions(ctx context.Context, campaignID uuid.UUID) ([]ProfitDistributionDTO, error) {
	dists, err := s.q.ListProfitDistributionsByCampaign(ctx, pgtype.UUID{Bytes: campaignID, Valid: true})
	if err != nil {
		return nil, apperr.Internal("Gagal mengambil riwayat distribusi: " + err.Error())
	}

	res := make([]ProfitDistributionDTO, len(dists))
	for i, d := range dists {
		items, err := s.q.ListDistributionItemsByDistributionID(ctx, d.ID)
		if err != nil {
			return nil, apperr.Internal("Gagal mengambil rincian pembagian dividen: " + err.Error())
		}
		itemDTOs := make([]DistributionItemDTO, len(items))
		for j, it := range items {
			itemDTOs[j] = DistributionItemDTO{
				DistributionID: uuid.UUID(it.DistributionID.Bytes).String(),
				InvestmentID:   uuid.UUID(it.InvestmentID.Bytes).String(),
				InvestorID:     uuid.UUID(it.InvestorID.Bytes).String(),
				InvestorName:   it.InvestorName,
				AmountIDR:      it.AmountIdr,
			}
		}
		res[i] = ProfitDistributionDTO{
			ID:          uuid.UUID(d.ID.Bytes).String(),
			CampaignID:  uuid.UUID(d.CampaignID.Bytes).String(),
			PoolIDR:     d.PoolIdr,
			PeriodStart: d.PeriodStart.Time,
			PeriodEnd:   d.PeriodEnd.Time,
			CreatedAt:   d.CreatedAt.Time,
			Items:       itemDTOs,
		}
		if d.ReportSnapshotID.Valid {
			idStr := uuid.UUID(d.ReportSnapshotID.Bytes).String()
			res[i].ReportSnapshotID = &idStr
		}
	}
	return res, nil
}
