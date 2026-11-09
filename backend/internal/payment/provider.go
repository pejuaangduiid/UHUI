package payment

import (
	"context"
)

type ChargeRequest struct {
	InvestorID     string
	CampaignID     string
	IdempotencyKey string
	AmountIDR      int64
}

type ChargeResult struct {
	PaymentRef string
	Status     string
}

type PaymentProvider interface {
	Charge(ctx context.Context, req ChargeRequest) (*ChargeResult, error)
	Refund(ctx context.Context, paymentRef string, amountIDR int64) error
}
