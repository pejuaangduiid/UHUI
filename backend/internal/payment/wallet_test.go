package payment_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/uhui/backend/internal/payment"
)

func TestSimulatedProvider_Memory(t *testing.T) {
	p := payment.NewSimulatedProvider()
	uid := uuid.NewString()

	bal := p.GetBalance(uid)
	if bal != payment.DefaultInitialBalance {
		t.Fatalf("expected %d, got %d", payment.DefaultInitialBalance, bal)
	}

	newBal := p.TopUp(uid, 10_000_000)
	if newBal != payment.DefaultInitialBalance+10_000_000 {
		t.Fatalf("expected %d, got %d", payment.DefaultInitialBalance+10_000_000, newBal)
	}

	res, err := p.Charge(context.Background(), payment.ChargeRequest{
		InvestorID: uid,
		AmountIDR:  5_000_000,
	})
	if err != nil {
		t.Fatalf("charge failed: %v", err)
	}
	if res.Status != "settled" {
		t.Fatalf("expected settled, got %s", res.Status)
	}

	balAfter := p.GetBalance(uid)
	if balAfter != newBal-5_000_000 {
		t.Fatalf("expected %d, got %d", newBal-5_000_000, balAfter)
	}

	_, err = p.Charge(context.Background(), payment.ChargeRequest{
		InvestorID: uid,
		AmountIDR:  100_000_000,
	})
	if err == nil {
		t.Fatal("expected charge error for insufficient funds, got nil")
	}
}

