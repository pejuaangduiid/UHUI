package ledger_test

import (
	"context"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/modules/inventory"
	"github.com/uhui/backend/internal/modules/ledger"
)

func setupTestSMEAndItem(t *testing.T, initialStock int32) (pgtype.UUID, pgtype.UUID, pgtype.UUID, *ledger.Service, *inventory.Service) {
	t.Helper()
	ctx := context.Background()
	pool := db.OpenTestPool(t)

	var smeIDStr, ownerIDStr string
	err := pool.QueryRow(ctx, `
		WITH new_user AS (
			INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
			VALUES ('test-ledger-' || gen_random_uuid() || '@test.id', 'dummy_hash', 'Ledger Owner', 'sme_owner', NOW())
			RETURNING id
		)
		INSERT INTO smes (owner_id, business_name, slug, sector, ai_interval)
		SELECT id, 'Ledger Store', 'ledger-' || id, 'Retail', 'disabled'::ai_schedule_interval FROM new_user
		RETURNING id::text, owner_id::text
	`).Scan(&smeIDStr, &ownerIDStr)
	if err != nil {
		t.Fatalf("failed to setup test SME: %v", err)
	}

	var smeID, ownerID pgtype.UUID
	_ = smeID.Scan(smeIDStr)
	_ = ownerID.Scan(ownerIDStr)

	invSvc := inventory.NewService(pool)
	ledgerSvc := ledger.NewService(pool)

	item, err := invSvc.CreateItem(ctx, smeID, inventory.CreateItemInput{
		SKU:               "SKU-" + smeIDStr[:6],
		Name:              "Barang Uji",
		StockQty:          initialStock,
		UnitCostIDR:       10_000,
		SellingPriceIDR:   15_000,
		LowStockThreshold: 3,
	})
	if err != nil {
		t.Fatalf("failed to create test item: %v", err)
	}

	return smeID, ownerID, item.ID, ledgerSvc, invSvc
}

func TestR1_1_InsufficientStockRejected(t *testing.T) {
	ctx := context.Background()
	smeID, ownerID, itemID, ledgerSvc, _ := setupTestSMEAndItem(t, 5)

	var itemIDStr string
	_ = itemID.Scan(itemIDStr)
	src := itemID.Bytes
	itemIDStr = strings.Join([]string{
		string(hexStr(src[0:4])),
		string(hexStr(src[4:6])),
		string(hexStr(src[6:8])),
		string(hexStr(src[8:10])),
		string(hexStr(src[10:16])),
	}, "-")

	_, err := ledgerSvc.CreateTransaction(ctx, smeID, ownerID, ledger.CreateTxInput{
		TxType:         "sale",
		TotalAmountIDR: 150_000,
		Description:    "Sale exceeding stock",
		Items: []ledger.TxItemInput{
			{InventoryItemID: itemIDStr, Qty: 10, UnitPriceIDR: 15_000},
		},
	})

	if err == nil {
		t.Fatal("expected sale to be rejected due to insufficient stock, but it succeeded")
	}

	appErr, ok := err.(*apperr.Error)
	if !ok || appErr.Code != apperr.CodeInsufficientStock {
		t.Fatalf("expected error code INSUFFICIENT_STOCK, got: %v", err)
	}
}

func TestR1_7_ReversalRestoresStock(t *testing.T) {
	ctx := context.Background()
	smeID, ownerID, itemID, ledgerSvc, invSvc := setupTestSMEAndItem(t, 10)

	src := itemID.Bytes
	itemIDStr := strings.Join([]string{
		string(hexStr(src[0:4])),
		string(hexStr(src[4:6])),
		string(hexStr(src[6:8])),
		string(hexStr(src[8:10])),
		string(hexStr(src[10:16])),
	}, "-")

	tx, err := ledgerSvc.CreateTransaction(ctx, smeID, ownerID, ledger.CreateTxInput{
		TxType:         "sale",
		TotalAmountIDR: 60_000,
		Description:    "Sale of 4 units",
		Items: []ledger.TxItemInput{
			{InventoryItemID: itemIDStr, Qty: 4, UnitPriceIDR: 15_000},
		},
	})
	if err != nil {
		t.Fatalf("failed to create sale: %v", err)
	}

	items, _ := invSvc.ListItems(ctx, smeID)
	if items[0].StockQty != 6 {
		t.Fatalf("expected stock 6 after selling 4, got %d", items[0].StockQty)
	}

	revTx, err := ledgerSvc.ReverseTransaction(ctx, smeID, ownerID, tx.ID, "Customer cancel")
	if err != nil {
		t.Fatalf("failed to reverse sale: %v", err)
	}
	if !revTx.ReversesTxID.Valid {
		t.Fatal("expected ReversesTxID to be set on reversal transaction")
	}

	itemsAfter, _ := invSvc.ListItems(ctx, smeID)
	if itemsAfter[0].StockQty != 10 {
		t.Fatalf("expected stock restored to 10 after reversal, got %d", itemsAfter[0].StockQty)
	}

	_, err = ledgerSvc.ReverseTransaction(ctx, smeID, ownerID, revTx.ID, "Reversing reversal")
	if err == nil {
		t.Fatal("expected error when reversing a reversal transaction, but got none")
	}
	appErr, ok := err.(*apperr.Error)
	if !ok || appErr.Code != apperr.CodeCannotReverseReversal {
		t.Fatalf("expected CANNOT_REVERSE_REVERSAL error code, got: %v", err)
	}
}

func hexStr(b []byte) []byte {
	const hex = "0123456789abcdef"
	res := make([]byte, len(b)*2)
	for i, v := range b {
		res[i*2] = hex[v>>4]
		res[i*2+1] = hex[v&0x0f]
	}
	return res
}
