package metrics

import "time"

type Aggregates struct {
	FirstTxDate        *time.Time
	RevenueIDR         int64
	ExpenseIDR         int64
	NetCashFlowIDR     int64
	RestockTotalIDR    int64
	RestockVerifiedIDR int64
	RestockCount       int
	ActiveDaysCount    int
	TotalTxCount       int
}

type Weights struct {
	WeightA int `json:"a"`
	WeightB int `json:"b"`
	WeightC int `json:"c"`
	WeightD int `json:"d"`
}

type ItemWeights struct {
	Profile     int `json:"profile"`
	NIB         int `json:"nib"`
	NPWP        int `json:"npwp"`
	BankAccount int `json:"bank_account"`
	PTDeed      int `json:"pt_deed"`
}

type ConfigWeights struct {
	DItems map[string]ItemWeights `json:"d_items"`
	W      Weights                `json:"w"`
}

type EvaluationResult struct {
	ComponentB   *int     `json:"component_b"`
	Total        *int     `json:"total"`
	GateFailures []string `json:"gate_failures"`
	ComponentA   int      `json:"component_a"`
	ComponentC   int      `json:"component_c"`
	ComponentD   int      `json:"component_d"`
	GatePassed   bool     `json:"gate_passed"`
}
