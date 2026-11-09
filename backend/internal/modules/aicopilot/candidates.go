package aicopilot

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/money"
)

type CandidateAnomaly struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

const (
	ThresholdPriceIncreaseBps = 1500
)

func DetectCandidates(
	ctx context.Context,
	q gen.Querier,
	smeID pgtype.UUID,
	periodStart time.Time,
	revenueIDR, netCashIDR int64,
) ([]CandidateAnomaly, []string, error) {
	dead, deadIDs, err := detectDeadStock(ctx, q, smeID, periodStart)
	if err != nil {
		return nil, nil, err
	}

	price, priceIDs, err := detectPriceIncreases(ctx, q, smeID, periodStart)
	if err != nil {
		return nil, nil, err
	}

	candidates := append(dead, price...)
	candidateIDs := append(deadIDs, priceIDs...)

	if revenueIDR > 0 && netCashIDR < 0 {
		candidates = append(candidates, CandidateAnomaly{
			ID:          "margin_drop",
			Type:        "margin_drop",
			Title:       "Arus Kas Operasional Defisit",
			Description: "Pengeluaran melebihi pemasukan pada periode ini.",
		})
		candidateIDs = append(candidateIDs, "margin_drop")
	}

	return candidates, candidateIDs, nil
}

func detectDeadStock(ctx context.Context, q gen.Querier, smeID pgtype.UUID, start time.Time) ([]CandidateAnomaly, []string, error) {
	deadParams := gen.FindDeadStockItemsParams{
		SmeID:  smeID,
		TxDate: pgtype.Timestamptz{Time: start, Valid: true},
	}
	items, err := q.FindDeadStockItems(ctx, deadParams)
	if err != nil {
		return nil, nil, fmt.Errorf("find dead stock: %w", err)
	}

	res := make([]CandidateAnomaly, 0, len(items))
	ids := make([]string, 0, len(items))
	for _, item := range items {
		idStr := fmt.Sprintf("dead_stock:%s", uuid.UUID(item.ID.Bytes).String())
		res = append(res, CandidateAnomaly{
			ID:          idStr,
			Type:        "dead_stock",
			Title:       fmt.Sprintf("Stok Tidak Bergerak: %s", item.Name),
			Description: fmt.Sprintf("Stok %d unit tanpa penjualan dalam periode analisis.", item.StockQty),
		})
		ids = append(ids, idStr)
	}
	return res, ids, nil
}

func detectPriceIncreases(ctx context.Context, q gen.Querier, smeID pgtype.UUID, start time.Time) ([]CandidateAnomaly, []string, error) {
	priceParams := gen.FindRecentRestockPriceIncreasesParams{
		SmeID:  smeID,
		TxDate: pgtype.Timestamptz{Time: start, Valid: true},
	}
	items, err := q.FindRecentRestockPriceIncreases(ctx, priceParams)
	if err != nil {
		return nil, nil, fmt.Errorf("find price increases: %w", err)
	}

	res := make([]CandidateAnomaly, 0, len(items))
	ids := make([]string, 0, len(items))
	for _, item := range items {
		if item.BaselineCostIdr <= 0 {
			continue
		}
		diff := item.RestockPriceIdr - item.BaselineCostIdr
		bps, mErr := money.MulDivFloor(diff, 10000, item.BaselineCostIdr)
		if mErr == nil && bps >= ThresholdPriceIncreaseBps {
			idStr := fmt.Sprintf("price_up:%s", uuid.UUID(item.InventoryItemID.Bytes).String())
			res = append(res, CandidateAnomaly{
				ID:          idStr,
				Type:        "price_up",
				Title:       fmt.Sprintf("Kenaikan Harga Beli: %s", item.ItemName),
				Description: fmt.Sprintf("Harga restock melonjak menjadi Rp%d.", item.RestockPriceIdr),
			})
			ids = append(ids, idStr)
		}
	}
	return res, ids, nil
}
