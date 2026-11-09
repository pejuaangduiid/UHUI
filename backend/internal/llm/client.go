package llm

import (
	"context"
)

type ProposedItem struct {
	Description  string `json:"description"`
	Qty          int32  `json:"qty"`
	UnitPriceIDR int64  `json:"unit_price_idr"`
	LineTotalIDR int64  `json:"line_total_idr"`
}

type ReceiptProposal struct {
	MerchantName string         `json:"merchant_name"`
	Date         string         `json:"date"`
	Items        []ProposedItem `json:"items"`
	TotalAmount  int64          `json:"total_amount"`
}

type InsightInput struct {
	SMEID        string
	CandidateIDs []string
	DeadstockSKU []string
	SalesIDR     int64
	ExpensesIDR  int64
	NetCashIDR   int64
}

type InsightOutput struct {
	SummaryText string   `json:"summary_text"`
	Anomalies   []string `json:"anomalies"`
	ActionItems []string `json:"action_items"`
}

type LLMClient interface {
	Name() string
	ExtractReceipt(ctx context.Context, img []byte, mime string) (*ReceiptProposal, error)
	GenerateInsight(ctx context.Context, in InsightInput) (*InsightOutput, error)
}
