package inventory

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
)

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

type CreateItemInput struct {
	SKU               string `json:"sku"`
	Name              string `json:"name"`
	UnitCostIDR       int64  `json:"unit_cost_idr"`
	SellingPriceIDR   int64  `json:"selling_price_idr"`
	StockQty          int32  `json:"stock_qty"`
	LowStockThreshold int32  `json:"low_stock_threshold"`
}

type UpdateItemInput struct {
	Name              string `json:"name"`
	UnitCostIDR       int64  `json:"unit_cost_idr"`
	SellingPriceIDR   int64  `json:"selling_price_idr"`
	LowStockThreshold int32  `json:"low_stock_threshold"`
}

func (s *Service) CreateItem(ctx context.Context, smeID pgtype.UUID, in CreateItemInput) (*gen.InventoryItem, error) {
	if strings.TrimSpace(in.SKU) == "" || strings.TrimSpace(in.Name) == "" {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "SKU dan nama barang wajib diisi", "")
	}
	if in.StockQty < 0 || in.UnitCostIDR < 0 || in.SellingPriceIDR < 0 {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Stok dan harga tidak boleh negatif", "")
	}

	threshold := in.LowStockThreshold
	if threshold <= 0 {
		threshold = 5
	}

	queries := gen.New(s.pool)
	item, err := queries.CreateInventoryItem(ctx, gen.CreateInventoryItemParams{
		SmeID:             smeID,
		Sku:               strings.TrimSpace(in.SKU),
		Name:              strings.TrimSpace(in.Name),
		StockQty:          in.StockQty,
		UnitCostIdr:       in.UnitCostIDR,
		SellingPriceIdr:   in.SellingPriceIDR,
		LowStockThreshold: threshold,
	})
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "inventory_items_sme_id_sku_key") {
			return nil, apperr.Conflict(apperr.CodeDuplicateProof, "SKU sudah terdaftar pada UMKM ini", "Gunakan SKU berbeda")
		}
		return nil, fmt.Errorf("create item: %w", err)
	}
	return &item, nil
}

func (s *Service) ListItems(ctx context.Context, smeID pgtype.UUID) ([]gen.InventoryItem, error) {
	queries := gen.New(s.pool)
	return queries.ListInventoryItems(ctx, smeID)
}

func (s *Service) UpdateItem(ctx context.Context, smeID, itemID pgtype.UUID, in UpdateItemInput) (*gen.InventoryItem, error) {
	if in.UnitCostIDR < 0 || in.SellingPriceIDR < 0 {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Harga tidak boleh negatif", "")
	}
	threshold := in.LowStockThreshold
	if threshold <= 0 {
		threshold = 5
	}

	queries := gen.New(s.pool)
	item, err := queries.UpdateInventoryItem(ctx, gen.UpdateInventoryItemParams{
		ID:                itemID,
		SmeID:             smeID,
		Name:              strings.TrimSpace(in.Name),
		UnitCostIdr:       in.UnitCostIDR,
		SellingPriceIdr:   in.SellingPriceIDR,
		LowStockThreshold: threshold,
	})
	if err != nil {
		return nil, apperr.NotFound(apperr.CodeNotFound, "Barang tidak ditemukan", "")
	}
	return &item, nil
}

func (s *Service) AdjustStock(ctx context.Context, smeID, itemID pgtype.UUID, delta int32, reason string) (*gen.InventoryItem, error) {
	if delta == 0 {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Perubahan stok tidak boleh 0", "")
	}
	if strings.TrimSpace(reason) == "" {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Alasan penyesuaian wajib diisi", "")
	}

	var updated gen.InventoryItem
	err := db.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		txQueries := gen.New(tx)
		item, err := txQueries.GetInventoryItemByID(ctx, gen.GetInventoryItemByIDParams{
			ID:    itemID,
			SmeID: smeID,
		})
		if err != nil {
			return apperr.NotFound(apperr.CodeNotFound, "Barang tidak ditemukan", "")
		}

		if item.StockQty+delta < 0 {
			return apperr.Unprocessable(apperr.CodeInsufficientStock, "Stok tidak boleh bernilai negatif", "Penyesuaian melebihi stok yang tersedia")
		}

		updated, err = txQueries.UpdateStockQty(ctx, gen.UpdateStockQtyParams{
			ID:       itemID,
			SmeID:    smeID,
			StockQty: delta,
		})
		if err != nil {
			return err
		}

		_, err = txQueries.CreateStockMovement(ctx, gen.CreateStockMovementParams{
			SmeID:           smeID,
			InventoryItemID: itemID,
			TxID:            pgtype.UUID{Valid: false},
			DeltaQty:        delta,
			Reason:          "adjustment",
		})
		return err
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (s *Service) ListMovements(ctx context.Context, smeID, itemID pgtype.UUID, limit int32) ([]gen.StockMovement, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	queries := gen.New(s.pool)
	return queries.ListStockMovements(ctx, gen.ListStockMovementsParams{
		SmeID:           smeID,
		InventoryItemID: itemID,
		Limit:           limit,
	})
}
