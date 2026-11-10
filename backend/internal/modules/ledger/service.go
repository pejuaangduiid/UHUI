package ledger

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/metrics"
)

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

type TxItemInput struct {
	InventoryItemID string `json:"inventory_item_id"`
	Qty             int32  `json:"qty"`
	UnitPriceIDR    int64  `json:"unit_price_idr"`
}

type CreateTxInput struct {
	TxDate           *time.Time    `json:"tx_date,omitempty"`
	OCRTotalIDR      *int64        `json:"ocr_total_idr,omitempty"`
	TxType           string        `json:"tx_type"`
	Description      string        `json:"description"`
	ProofObjectKey   string        `json:"proof_object_key,omitempty"`
	Items            []TxItemInput `json:"items,omitempty"`
	ProofSHA256      []byte        `json:"proof_sha256,omitempty"`
	TotalAmountIDR   int64         `json:"total_amount_idr"`
	DuplicateSuspect bool          `json:"duplicate_suspect,omitempty"`
	IsOCRVerified    bool          `json:"is_ocr_verified,omitempty"`
}

func (s *Service) CreateTransaction(ctx context.Context, smeID, createdBy pgtype.UUID, in CreateTxInput) (*gen.OperationalTransaction, error) {
	if err := validateTxInput(in); err != nil {
		return nil, err
	}

	queries := gen.New(s.pool)
	if sme, smeErr := queries.GetSMEByID(ctx, smeID); smeErr == nil && sme.IsSuspended {
		return nil, apperr.Forbidden("SME_SUSPENDED", "Operasional UMKM ini sedang ditangguhkan oleh Admin", "Tidak dapat mencatat transaksi saat status bisnis ditangguhkan")
	}

	txDate := time.Now()
	if in.TxDate != nil {
		txDate = *in.TxDate
	}
	if time.Since(txDate) > 7*24*time.Hour {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Tanggal transaksi maksimal 7 hari ke belakang (R1.4)", "")
	}

	var createdTx gen.OperationalTransaction
	err := db.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		txQueries := gen.New(tx)
		var err error
		createdTx, err = insertTxRow(ctx, txQueries, smeID, createdBy, txDate, in)
		if err != nil {
			return err
		}

		return applyTxItemsAndStock(ctx, txQueries, smeID, createdTx.ID, in.TxType, in.Items)
	})
	if err != nil {
		return nil, err
	}
	return &createdTx, nil
}

func validateTxInput(in CreateTxInput) error {
	in.TxType = strings.ToLower(strings.TrimSpace(in.TxType))
	if in.TxType != "sale" && in.TxType != "expense" && in.TxType != "restock" {
		return apperr.BadRequest(apperr.CodeBadRequest, "Tipe transaksi harus sale, expense, atau restock", "")
	}
	if in.TotalAmountIDR <= 0 {
		return apperr.BadRequest(apperr.CodeBadRequest, "Nominal transaksi harus lebih dari nol", "")
	}
	if strings.TrimSpace(in.Description) == "" {
		return apperr.BadRequest(apperr.CodeBadRequest, "Deskripsi transaksi wajib diisi", "")
	}
	return nil
}

func insertTxRow(ctx context.Context, q *gen.Queries, smeID, createdBy pgtype.UUID, txDate time.Time, in CreateTxInput) (gen.OperationalTransaction, error) {
	var ocrTotal pgtype.Int8
	if in.OCRTotalIDR != nil {
		ocrTotal = pgtype.Int8{Int64: *in.OCRTotalIDR, Valid: true}
	}
	var proofKey pgtype.Text
	if in.ProofObjectKey != "" {
		proofKey = pgtype.Text{String: in.ProofObjectKey, Valid: true}
	}

	return q.CreateOperationalTransaction(ctx, gen.CreateOperationalTransactionParams{
		SmeID:            smeID,
		CreatedBy:        createdBy,
		TxType:           in.TxType,
		TotalAmountIdr:   in.TotalAmountIDR,
		Description:      in.Description,
		ProofObjectKey:   proofKey,
		ProofSha256:      in.ProofSHA256,
		OcrTotalIdr:      ocrTotal,
		DuplicateSuspect: in.DuplicateSuspect,
		IsOcrVerified:    in.IsOCRVerified,
		ReversesTxID:     pgtype.UUID{Valid: false},
		TxDate:           pgtype.Timestamptz{Time: txDate, Valid: true},
	})
}

func applyTxItemsAndStock(ctx context.Context, q *gen.Queries, smeID, txID pgtype.UUID, txType string, items []TxItemInput) error {
	for _, it := range items {
		var itemID pgtype.UUID
		if err := itemID.Scan(it.InventoryItemID); err != nil {
			return apperr.BadRequest(apperr.CodeBadRequest, "ID barang tidak valid", "")
		}

		itemName, err := applyStockDelta(ctx, q, smeID, txID, itemID, txType, it.Qty)
		if err != nil {
			return err
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
	}
	return nil
}

func applyStockDelta(ctx context.Context, q *gen.Queries, smeID, txID, itemID pgtype.UUID, txType string, qty int32) (string, error) {
	var delta int32
	var reason string
	switch txType {
	case "sale":
		delta = -qty
		reason = "sale"
	case "restock":
		delta = qty
		reason = "restock"
	default:
		return "", nil
	}

	cur, err := q.GetInventoryItemByID(ctx, gen.GetInventoryItemByIDParams{ID: itemID, SmeID: smeID})
	if err != nil {
		return "", apperr.NotFound(apperr.CodeNotFound, "Barang tidak ditemukan", "")
	}
	if cur.StockQty+delta < 0 {
		return "", apperr.Unprocessable(apperr.CodeInsufficientStock, fmt.Sprintf("Stok %s tidak mencukupi (sisa %d, diminta %d)", cur.Name, cur.StockQty, qty), "Kurangi jumlah barang")
	}

	if _, updateErr := q.UpdateStockQty(ctx, gen.UpdateStockQtyParams{ID: itemID, SmeID: smeID, StockQty: delta}); updateErr != nil {
		return "", updateErr
	}
	_, err = q.CreateStockMovement(ctx, gen.CreateStockMovementParams{
		SmeID:           smeID,
		InventoryItemID: itemID,
		TxID:            txID,
		DeltaQty:        delta,
		Reason:          reason,
	})
	return cur.Name, err
}

func (s *Service) ReverseTransaction(ctx context.Context, smeID, createdBy, origTxID pgtype.UUID, reason string) (*gen.OperationalTransaction, error) {
	if strings.TrimSpace(reason) == "" {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Alasan pembalikan wajib diisi", "")
	}

	var revTx gen.OperationalTransaction
	err := db.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		txQueries := gen.New(tx)
		orig, err := txQueries.GetTransactionByID(ctx, gen.GetTransactionByIDParams{ID: origTxID, SmeID: smeID})
		if err != nil {
			return apperr.NotFound(apperr.CodeNotFound, "Transaksi tidak ditemukan", "")
		}
		if orig.ReversesTxID.Valid {
			return apperr.Unprocessable(apperr.CodeCannotReverseReversal, "Tidak dapat membalik transaksi pembalik (R1.7)", "")
		}
		isReversed, err := txQueries.CheckIfTransactionReversed(ctx, origTxID)
		if err != nil {
			return err
		}
		if isReversed {
			return apperr.Unprocessable(apperr.CodeTxAlreadyReversed, "Transaksi ini sudah dibalik sebelumnya (R1.7)", "")
		}

		items, err := txQueries.ListTransactionItems(ctx, origTxID)
		if err != nil {
			return err
		}

		revTx, err = txQueries.CreateOperationalTransaction(ctx, gen.CreateOperationalTransactionParams{
			SmeID:            smeID,
			CreatedBy:        createdBy,
			TxType:           orig.TxType,
			TotalAmountIdr:   orig.TotalAmountIdr,
			Description:      fmt.Sprintf("Pembalikan (%s): %s", orig.Description, reason),
			ProofObjectKey:   pgtype.Text{Valid: false},
			ProofSha256:      nil,
			OcrTotalIdr:      pgtype.Int8{Valid: false},
			DuplicateSuspect: false,
			IsOcrVerified:    false,
			ReversesTxID:     origTxID,
			TxDate:           pgtype.Timestamptz{Time: time.Now(), Valid: true},
		})
		if err != nil {
			return err
		}

		return reverseStockMovements(ctx, txQueries, smeID, revTx.ID, orig.TxType, items)
	})
	if err != nil {
		return nil, err
	}
	return &revTx, nil
}

func reverseStockMovements(ctx context.Context, q *gen.Queries, smeID, revTxID pgtype.UUID, txType string, items []gen.ListTransactionItemsRow) error {
	for _, it := range items {
		var delta int32
		switch txType {
		case "sale":
			delta = it.Qty
		case "restock":
			delta = -it.Qty
		default:
			continue
		}

		cur, err := q.GetInventoryItemByID(ctx, gen.GetInventoryItemByIDParams{ID: it.InventoryItemID, SmeID: smeID})
		if err != nil {
			return err
		}
		if cur.StockQty+delta < 0 {
			return apperr.Unprocessable(apperr.CodeInsufficientStock, fmt.Sprintf("Gagal membalik restock: stok %s sudah terpakai (sisa %d, butuh %d)", cur.Name, cur.StockQty, it.Qty), "")
		}

		if _, err := q.UpdateStockQty(ctx, gen.UpdateStockQtyParams{ID: it.InventoryItemID, SmeID: smeID, StockQty: delta}); err != nil {
			return err
		}
		if _, err := q.CreateStockMovement(ctx, gen.CreateStockMovementParams{
			SmeID:           smeID,
			InventoryItemID: it.InventoryItemID,
			TxID:            revTxID,
			DeltaQty:        delta,
			Reason:          "reversal",
		}); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) ListTransactions(ctx context.Context, smeID pgtype.UUID, limit int32) ([]gen.OperationalTransaction, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	queries := gen.New(s.pool)
	return queries.ListTransactions(ctx, gen.ListTransactionsParams{
		SmeID: smeID,
		Limit: limit,
	})
}

func (s *Service) GetAggregates30Days(ctx context.Context, smeID pgtype.UUID) (metrics.Aggregates, error) {
	now := time.Now().In(metrics.WIB)
	start, end := metrics.Window30(now)

	queries := gen.New(s.pool)
	row, err := queries.GetEffectiveAggregates30Days(ctx, gen.GetEffectiveAggregates30DaysParams{
		SmeID:    smeID,
		TxDate:   pgtype.Timestamptz{Time: start, Valid: true},
		TxDate_2: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return metrics.Aggregates{}, err
	}

	var firstTx *time.Time
	if row.FirstTxDate != nil {
		if t, ok := row.FirstTxDate.(time.Time); ok {
			firstTx = &t
		}
	}

	return metrics.Aggregates{
		RevenueIDR:         row.RevenueIdr,
		ExpenseIDR:         row.ExpenseIdr,
		NetCashFlowIDR:     row.RevenueIdr - row.ExpenseIdr,
		RestockTotalIDR:    row.RestockTotalIdr,
		RestockVerifiedIDR: row.RestockVerifiedIdr,
		RestockCount:       int(row.RestockCount),
		ActiveDaysCount:    int(row.ActiveDaysCount),
		TotalTxCount:       int(row.TotalTxCount),
		FirstTxDate:        firstTx,
	}, nil
}
