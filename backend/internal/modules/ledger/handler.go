package ledger

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

type TxDTO struct {
	TxDate           time.Time `json:"tx_date"`
	CreatedAt        time.Time `json:"created_at"`
	ReversesTxID     *string   `json:"reverses_tx_id,omitempty"`
	ID               string    `json:"id"`
	SmeID            string    `json:"sme_id"`
	CreatedBy        string    `json:"created_by"`
	TxType           string    `json:"tx_type"`
	Description      string    `json:"description"`
	TotalAmountIDR   int64     `json:"total_amount_idr"`
	DuplicateSuspect bool      `json:"duplicate_suspect"`
	IsOCRVerified    bool      `json:"is_ocr_verified"`
}

type AggregatesDTO struct {
	FirstTxDate        string `json:"first_tx_date,omitempty"`
	RevenueIDR         int64  `json:"revenue_idr"`
	ExpenseIDR         int64  `json:"expense_idr"`
	NetCashFlowIDR     int64  `json:"net_cash_flow_idr"`
	RestockTotalIDR    int64  `json:"restock_total_idr"`
	RestockVerifiedIDR int64  `json:"restock_verified_idr"`
	RestockCount       int    `json:"restock_count"`
	ActiveDaysCount    int    `json:"active_days_count"`
	TotalTxCount       int    `json:"total_tx_count"`
}

func RegisterHandlers(api huma.API, svc *Service, pool *pgxpool.Pool) {
	registerCreate(api, svc, pool)
	registerList(api, svc, pool)
	registerReverse(api, svc, pool)
	registerAggregates(api, svc, pool)
}

func registerCreate(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "ledgerCreateTx",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/transactions",
		Summary:     "Create operational transaction",
		Tags:        []string{"Ledger"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  CreateTxInput
	}) (*struct{ Body TxDTO }, error) {
		p, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID)
		if err != nil {
			return nil, mapAppError(err)
		}
		var sid, uid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		_ = uid.Scan(p.UserID)

		tx, err := svc.CreateTransaction(ctx, sid, uid, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body TxDTO }{Body: toTxDTO(*tx)}, nil
	})
}

func registerList(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "ledgerListTx",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/transactions",
		Summary:     "List transactions",
		Tags:        []string{"Ledger"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
	}) (*struct{ Body []TxDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)

		txs, err := svc.ListTransactions(ctx, sid, 50)
		if err != nil {
			return nil, mapAppError(err)
		}
		dtos := make([]TxDTO, len(txs))
		for i, t := range txs {
			dtos[i] = toTxDTO(t)
		}
		return &struct{ Body []TxDTO }{Body: dtos}, nil
	})
}

func registerReverse(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "ledgerReverseTx",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/transactions/{id}/reverse",
		Summary:     "Reverse transaction and restore stock",
		Tags:        []string{"Ledger"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		ID    string `path:"id"`
		Body  struct {
			Reason string `json:"reason"`
		}
	}) (*struct{ Body TxDTO }, error) {
		p, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID)
		if err != nil {
			return nil, mapAppError(err)
		}
		var sid, uid, tid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		_ = uid.Scan(p.UserID)
		_ = tid.Scan(in.ID)

		rev, err := svc.ReverseTransaction(ctx, sid, uid, tid, in.Body.Reason)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body TxDTO }{Body: toTxDTO(*rev)}, nil
	})
}

func registerAggregates(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "ledgerAggregates",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/aggregates",
		Summary:     "Get 30-day aggregates",
		Tags:        []string{"Ledger"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
	}) (*struct{ Body AggregatesDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)

		agg, err := svc.GetAggregates30Days(ctx, sid)
		if err != nil {
			return nil, mapAppError(err)
		}

		var firstTxStr string
		if agg.FirstTxDate != nil {
			firstTxStr = agg.FirstTxDate.Format(time.RFC3339)
		}

		return &struct{ Body AggregatesDTO }{
			Body: AggregatesDTO{
				RevenueIDR:         agg.RevenueIDR,
				ExpenseIDR:         agg.ExpenseIDR,
				NetCashFlowIDR:     agg.NetCashFlowIDR,
				RestockTotalIDR:    agg.RestockTotalIDR,
				RestockVerifiedIDR: agg.RestockVerifiedIDR,
				RestockCount:       agg.RestockCount,
				ActiveDaysCount:    agg.ActiveDaysCount,
				TotalTxCount:       agg.TotalTxCount,
				FirstTxDate:        firstTxStr,
			},
		}, nil
	})
}

func toTxDTO(t gen.OperationalTransaction) TxDTO {
	var revID *string
	if t.ReversesTxID.Valid {
		s := uuidToString(t.ReversesTxID)
		revID = &s
	}
	return TxDTO{
		ID:               uuidToString(t.ID),
		SmeID:            uuidToString(t.SmeID),
		CreatedBy:        uuidToString(t.CreatedBy),
		TxType:           t.TxType,
		TotalAmountIDR:   t.TotalAmountIdr,
		Description:      t.Description,
		DuplicateSuspect: t.DuplicateSuspect,
		IsOCRVerified:    t.IsOcrVerified,
		ReversesTxID:     revID,
		TxDate:           t.TxDate.Time,
		CreatedAt:        t.CreatedAt.Time,
	}
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	src := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", src[0:4], src[4:6], src[6:8], src[8:10], src[10:16])
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
