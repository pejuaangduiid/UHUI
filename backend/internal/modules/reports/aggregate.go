package reports

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db/gen"
)

const SimulationNotice = "Platform Simulasi Edukasi & Pengujian - Bukan Penawaran Efek Berdasarkan UU Pasar Modal"

type SakEmkmPayload struct {
	DocType               string `json:"doc_type"`
	PeriodEnd             string `json:"period_end"`
	PeriodStart           string `json:"period_start"`
	SmeID                 string `json:"sme_id"`
	CashBalanceIDR        int64  `json:"cash_balance_idr"`
	NetProfitIDR          int64  `json:"net_profit_idr"`
	OperationalExpenseIDR int64  `json:"operational_expense_idr"`
	RestockExpenseIDR     int64  `json:"restock_expense_idr"`
	RevenueIDR            int64  `json:"revenue_idr"`
	TotalAssetsIDR        int64  `json:"total_assets_idr"`
	TotalExpenseIDR       int64  `json:"total_expense_idr"`
	TotalInventoryCostIDR int64  `json:"total_inventory_cost_idr"`
}

type ProspectusPayload struct {
	BusinessName    string `json:"business_name"`
	Description     string `json:"description"`
	DocType         string `json:"doc_type"`
	PeriodEnd       string `json:"period_end"`
	PeriodStart     string `json:"period_start"`
	Sector          string `json:"sector"`
	SimulationLabel string `json:"simulation_label"`
	Slug            string `json:"slug"`
	SmeID           string `json:"sme_id"`
	Expense30dIDR   int64  `json:"expense_30d_idr"`
	NetCash30dIDR   int64  `json:"net_cash_30d_idr"`
	Revenue30dIDR   int64  `json:"revenue_30d_idr"`
	ComponentA      int16  `json:"component_a"`
	ComponentB      int16  `json:"component_b"`
	ComponentC      int16  `json:"component_c"`
	ComponentD      int16  `json:"component_d"`
	ReadinessScore  int16  `json:"readiness_score"`
	IsPT            bool   `json:"is_pt"`
}

type ShareholderMonthlyPayload struct {
	DocType               string `json:"doc_type"`
	PeriodEnd             string `json:"period_end"`
	PeriodStart           string `json:"period_start"`
	SmeID                 string `json:"sme_id"`
	NetProfitIDR          int64  `json:"net_profit_idr"`
	OperationalExpenseIDR int64  `json:"operational_expense_idr"`
	RestockExpenseIDR     int64  `json:"restock_expense_idr"`
	RevenueIDR            int64  `json:"revenue_idr"`
	TotalExpenseIDR       int64  `json:"total_expense_idr"`
	TxCount               int64  `json:"tx_count"`
	ActiveDays            int32  `json:"active_days"`
}

type Aggregator struct {
	q *gen.Queries
}

func NewAggregator(q *gen.Queries) *Aggregator {
	return &Aggregator{q: q}
}

func (a *Aggregator) BuildSakEmkm(ctx context.Context, smeID pgtype.UUID, start, end time.Time) (*SakEmkmPayload, error) {
	fin, err := a.q.GetPeriodFinancials(ctx, gen.GetPeriodFinancialsParams{
		SmeID:    smeID,
		TxDate:   pgtype.Timestamptz{Time: start, Valid: true},
		TxDate_2: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("get period financials: %w", err)
	}

	inv, err := a.q.GetTotalInventoryCost(ctx, smeID)
	if err != nil {
		return nil, fmt.Errorf("get inventory cost: %w", err)
	}

	cash, err := a.q.GetCumulativeCashBalance(ctx, gen.GetCumulativeCashBalanceParams{
		SmeID:  smeID,
		TxDate: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("get cash balance: %w", err)
	}

	totalExp := fin.RestockExpenseIdr + fin.OperationalExpenseIdr
	netProfit := fin.RevenueIdr - totalExp
	totalAssets := cash + inv

	return &SakEmkmPayload{
		SmeID:                 uuid.UUID(smeID.Bytes).String(),
		DocType:               "sak_emkm",
		PeriodStart:           start.Format("2006-01-02"),
		PeriodEnd:             end.Format("2006-01-02"),
		RevenueIDR:            fin.RevenueIdr,
		RestockExpenseIDR:     fin.RestockExpenseIdr,
		OperationalExpenseIDR: fin.OperationalExpenseIdr,
		TotalExpenseIDR:       totalExp,
		NetProfitIDR:          netProfit,
		CashBalanceIDR:        cash,
		TotalInventoryCostIDR: inv,
		TotalAssetsIDR:        totalAssets,
	}, nil
}

func (a *Aggregator) BuildProspectus(ctx context.Context, smeID pgtype.UUID, start, end time.Time) (*ProspectusPayload, error) {
	sme, err := a.q.GetSMEByID(ctx, smeID)
	if err != nil {
		return nil, fmt.Errorf("get sme: %w", err)
	}

	fin, err := a.q.GetPeriodFinancials(ctx, gen.GetPeriodFinancialsParams{
		SmeID:    smeID,
		TxDate:   pgtype.Timestamptz{Time: start, Valid: true},
		TxDate_2: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("get period financials: %w", err)
	}

	scoreRow, err := a.q.GetLatestReadinessScore(ctx, gen.GetLatestReadinessScoreParams{
		SmeID:  smeID,
		Scheme: "revenue_sharing",
	})
	var rScore, compA, compB, compC, compD int16
	if err == nil {
		if scoreRow.Total.Valid {
			rScore = scoreRow.Total.Int16
		}
		compA = scoreRow.ComponentA
		if scoreRow.ComponentB.Valid {
			compB = scoreRow.ComponentB.Int16
		}
		compC = scoreRow.ComponentC
		compD = scoreRow.ComponentD
	}

	totalExp := fin.RestockExpenseIdr + fin.OperationalExpenseIdr
	netCash := fin.RevenueIdr - totalExp

	return &ProspectusPayload{
		SmeID:           uuid.UUID(smeID.Bytes).String(),
		DocType:         "prospectus",
		PeriodStart:     start.Format("2006-01-02"),
		PeriodEnd:       end.Format("2006-01-02"),
		BusinessName:    sme.BusinessName,
		Slug:            sme.Slug,
		Sector:          sme.Sector,
		Description:     sme.Description,
		IsPT:            sme.IsIncorporatedPt,
		ReadinessScore:  rScore,
		ComponentA:      compA,
		ComponentB:      compB,
		ComponentC:      compC,
		ComponentD:      compD,
		Revenue30dIDR:   fin.RevenueIdr,
		Expense30dIDR:   totalExp,
		NetCash30dIDR:   netCash,
		SimulationLabel: SimulationNotice,
	}, nil
}

func (a *Aggregator) BuildShareholderMonthly(ctx context.Context, smeID pgtype.UUID, start, end time.Time) (*ShareholderMonthlyPayload, error) {
	fin, err := a.q.GetPeriodFinancials(ctx, gen.GetPeriodFinancialsParams{
		SmeID:    smeID,
		TxDate:   pgtype.Timestamptz{Time: start, Valid: true},
		TxDate_2: pgtype.Timestamptz{Time: end, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("get period financials: %w", err)
	}

	totalExp := fin.RestockExpenseIdr + fin.OperationalExpenseIdr
	netProfit := fin.RevenueIdr - totalExp

	return &ShareholderMonthlyPayload{
		SmeID:                 uuid.UUID(smeID.Bytes).String(),
		DocType:               "shareholder_monthly",
		PeriodStart:           start.Format("2006-01-02"),
		PeriodEnd:             end.Format("2006-01-02"),
		RevenueIDR:            fin.RevenueIdr,
		RestockExpenseIDR:     fin.RestockExpenseIdr,
		OperationalExpenseIDR: fin.OperationalExpenseIdr,
		TotalExpenseIDR:       totalExp,
		NetProfitIDR:          netProfit,
		TxCount:               fin.TxCount,
		ActiveDays:            fin.ActiveDays,
	}, nil
}
