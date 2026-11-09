package receipts

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
)

type ConfirmItemInput struct {
	InventoryItemID string `json:"inventory_item_id,omitempty"`
	Description     string `json:"description,omitempty"`
	UnitPriceIDR    int64  `json:"unit_price_idr"`
	Qty             int32  `json:"qty"`
	AutoCreate      bool   `json:"auto_create,omitempty"`
}

type ConfirmInput struct {
	ScanID         string             `json:"scan_id"`
	TxType         string             `json:"tx_type"`
	Description    string             `json:"description"`
	Items          []ConfirmItemInput `json:"items,omitempty"`
	TotalAmountIDR int64              `json:"total_amount_idr"`
}

func (s *Service) ConfirmScan(ctx context.Context, smeID, createdBy pgtype.UUID, in ConfirmInput) (*gen.OperationalTransaction, error) {
	var scanID pgtype.UUID
	if err := scanID.Scan(in.ScanID); err != nil {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Scan ID tidak valid", "")
	}

	var createdTx gen.OperationalTransaction
	err := db.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		txQueries := gen.New(tx)
		scan, err := txQueries.LockReceiptScanForConsume(ctx, gen.LockReceiptScanForConsumeParams{
			ID:    scanID,
			SmeID: smeID,
		})
		if err != nil {
			return apperr.NotFound(apperr.CodeNotFound, "Scan nota tidak ditemukan atau sudah digunakan", "")
		}

		isSuspect, _ := txQueries.CheckSuspectDuplicate(ctx, gen.CheckSuspectDuplicateParams{
			SmeID:          smeID,
			TotalAmountIdr: in.TotalAmountIDR,
			TxDate:         pgtype.Timestamptz{Time: time.Now(), Valid: true},
		})

		isVerified := (in.TotalAmountIDR == scan.OcrTotalIdr) && !isSuspect
		destKey := strings.Replace(scan.ObjectKey, "pending/", "proofs/", 1)
		_ = s.store.Move(ctx, scan.ObjectKey, destKey)

		createdTx, err = txQueries.CreateOperationalTransaction(ctx, gen.CreateOperationalTransactionParams{
			SmeID:            smeID,
			CreatedBy:        createdBy,
			TxType:           in.TxType,
			TotalAmountIdr:   in.TotalAmountIDR,
			Description:      in.Description,
			ProofObjectKey:   pgtype.Text{String: destKey, Valid: true},
			ProofSha256:      scan.Sha256,
			OcrTotalIdr:      pgtype.Int8{Int64: scan.OcrTotalIdr, Valid: true},
			DuplicateSuspect: isSuspect,
			IsOcrVerified:    isVerified,
			ReversesTxID:     pgtype.UUID{Valid: false},
			TxDate:           pgtype.Timestamptz{Time: time.Now(), Valid: true},
		})
		if err != nil {
			return fmt.Errorf("create tx: %w", err)
		}

		if itemErr := applyConfirmItems(ctx, txQueries, smeID, createdTx.ID, in.TxType, in.Items); itemErr != nil {
			return itemErr
		}

		_, err = txQueries.MarkReceiptScanConsumed(ctx, scanID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return &createdTx, nil
}

func applyConfirmItems(ctx context.Context, q *gen.Queries, smeID, txID pgtype.UUID, txType string, items []ConfirmItemInput) error {
	for _, it := range items {
		itemID, itemName, err := resolveOrCreateInventoryItem(ctx, q, smeID, it)
		if err != nil || !itemID.Valid {
			continue
		}

		lineTotal := int64(it.Qty) * it.UnitPriceIDR
		if _, err := q.CreateTransactionItem(ctx, gen.CreateTransactionItemParams{
			TxID:            txID,
			InventoryItemID: itemID,
			Description:     itemName,
			Qty:             it.Qty,
			UnitPriceIdr:    it.UnitPriceIDR,
			LineTotalIdr:    lineTotal,
		}); err != nil {
			return err
		}

		var delta int32
		var reason string
		switch txType {
		case "sale":
			delta = -it.Qty
			reason = "sale"
		case "restock", "expense":
			delta = it.Qty
			reason = "restock"
		default:
			continue
		}

		if _, err := q.UpdateStockQty(ctx, gen.UpdateStockQtyParams{ID: itemID, SmeID: smeID, StockQty: delta}); err != nil {
			return err
		}
		if _, err := q.CreateStockMovement(ctx, gen.CreateStockMovementParams{
			SmeID:           smeID,
			InventoryItemID: itemID,
			TxID:            txID,
			DeltaQty:        delta,
			Reason:          reason,
		}); err != nil {
			return err
		}
	}
	return nil
}

func resolveOrCreateInventoryItem(ctx context.Context, q *gen.Queries, smeID pgtype.UUID, it ConfirmItemInput) (pgtype.UUID, string, error) {
	var itemID pgtype.UUID
	if it.InventoryItemID != "" {
		if err := itemID.Scan(it.InventoryItemID); err == nil {
			if cur, err := q.GetInventoryItemByID(ctx, gen.GetInventoryItemByIDParams{ID: itemID, SmeID: smeID}); err == nil {
				return itemID, cur.Name, nil
			}
		}
	}

	desc := strings.TrimSpace(it.Description)
	if desc == "" {
		return itemID, "", nil
	}

	existing, _ := q.ListInventoryItems(ctx, smeID)
	for _, ex := range existing {
		if strings.EqualFold(strings.TrimSpace(ex.Name), desc) {
			return ex.ID, ex.Name, nil
		}
	}

	sku := generateSKU(desc)
	sellingPrice := it.UnitPriceIDR
	if sellingPrice <= 0 {
		sellingPrice = 10000
	}
	suggestedSelling := sellingPrice + (sellingPrice * 20 / 100)

	created, err := q.CreateInventoryItem(ctx, gen.CreateInventoryItemParams{
		SmeID:             smeID,
		Sku:               sku,
		Name:              desc,
		StockQty:          0,
		UnitCostIdr:       it.UnitPriceIDR,
		SellingPriceIdr:   suggestedSelling,
		LowStockThreshold: 5,
	})
	if err != nil {
		return itemID, "", err
	}
	return created.ID, created.Name, nil
}

func generateSKU(name string) string {
	clean := strings.ToUpper(strings.TrimSpace(name))
	var b strings.Builder
	for _, r := range clean {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
		if b.Len() >= 5 {
			break
		}
	}
	prefix := b.String()
	if prefix == "" {
		prefix = "ITEM"
	}
	return fmt.Sprintf("SKU-%s-%d", prefix, time.Now().UnixNano()%100000)
}
