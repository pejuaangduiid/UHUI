package payment

import (
	"context"
	"fmt"
	"sync"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const DefaultInitialBalance int64 = 50_000_000

type SimulatedProvider struct {
	pool       *pgxpool.Pool
	balances   map[string]int64
	mu         sync.RWMutex
	ShouldFail bool
}

func NewSimulatedProvider(pool ...*pgxpool.Pool) *SimulatedProvider {
	p := &SimulatedProvider{
		balances: make(map[string]int64),
	}
	if len(pool) > 0 && pool[0] != nil {
		p.pool = pool[0]
		_, _ = p.pool.Exec(context.Background(), `
			CREATE TABLE IF NOT EXISTS user_wallets (
				user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
				balance_idr BIGINT NOT NULL DEFAULT 50000000 CHECK (balance_idr >= 0),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			);
		`)
	}
	return p
}

func (s *SimulatedProvider) GetBalance(userID string) int64 {
	return s.GetBalanceContext(context.Background(), userID)
}

func (s *SimulatedProvider) GetBalanceContext(ctx context.Context, userID string) int64 {
	if s.pool != nil {
		uid, err := uuid.Parse(userID)
		if err == nil {
			var bal int64
			err := s.pool.QueryRow(ctx, "SELECT balance_idr FROM user_wallets WHERE user_id = $1", uid).Scan(&bal)
			if err == nil {
				return bal
			}
			_ = s.pool.QueryRow(ctx, "INSERT INTO user_wallets (user_id, balance_idr, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id RETURNING balance_idr", uid, DefaultInitialBalance).Scan(&bal)
			if bal > 0 {
				return bal
			}
			return DefaultInitialBalance
		}
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if s.balances == nil {
		s.balances = make(map[string]int64)
	}
	bal, exists := s.balances[userID]
	if !exists {
		s.balances[userID] = DefaultInitialBalance
		return DefaultInitialBalance
	}
	return bal
}

func (s *SimulatedProvider) TopUp(userID string, amountIDR int64) int64 {
	return s.TopUpContext(context.Background(), userID, amountIDR)
}

func (s *SimulatedProvider) TopUpContext(ctx context.Context, userID string, amountIDR int64) int64 {
	if s.pool != nil {
		uid, err := uuid.Parse(userID)
		if err == nil {
			var newBal int64
			err := s.pool.QueryRow(ctx, `
				INSERT INTO user_wallets (user_id, balance_idr, updated_at)
				VALUES ($1, $2, NOW())
				ON CONFLICT (user_id) DO UPDATE
				SET balance_idr = user_wallets.balance_idr + $3, updated_at = NOW()
				RETURNING balance_idr
			`, uid, DefaultInitialBalance+amountIDR, amountIDR).Scan(&newBal)
			if err == nil {
				return newBal
			}
		}
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if s.balances == nil {
		s.balances = make(map[string]int64)
	}
	bal, exists := s.balances[userID]
	if !exists {
		bal = DefaultInitialBalance
	}
	bal += amountIDR
	s.balances[userID] = bal
	return bal
}

func (s *SimulatedProvider) chargeDB(ctx context.Context, uid uuid.UUID, amount int64) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var bal int64
	err = tx.QueryRow(ctx, "SELECT balance_idr FROM user_wallets WHERE user_id = $1 FOR UPDATE", uid).Scan(&bal)
	if err != nil {
		bal = DefaultInitialBalance
		_, _ = tx.Exec(ctx, "INSERT INTO user_wallets (user_id, balance_idr, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO NOTHING", uid, DefaultInitialBalance)
	}
	if bal < amount {
		return fmt.Errorf("saldo tidak mencukupi (tersedia Rp %d, dibutuhkan Rp %d)", bal, amount)
	}

	_, err = tx.Exec(ctx, "UPDATE user_wallets SET balance_idr = balance_idr - $1, updated_at = NOW() WHERE user_id = $2", amount, uid)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *SimulatedProvider) chargeMemory(userID string, amount int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.balances == nil {
		s.balances = make(map[string]int64)
	}
	bal, exists := s.balances[userID]
	if !exists {
		bal = DefaultInitialBalance
	}
	if bal < amount {
		return fmt.Errorf("saldo tidak mencukupi (tersedia Rp %d, dibutuhkan Rp %d)", bal, amount)
	}
	s.balances[userID] = bal - amount
	return nil
}

func (s *SimulatedProvider) Charge(ctx context.Context, req ChargeRequest) (*ChargeResult, error) {
	if s.ShouldFail {
		return nil, fmt.Errorf("simulated payment failure")
	}

	if req.AmountIDR <= 0 {
		return &ChargeResult{
			PaymentRef: fmt.Sprintf("FREE-%s", uuid.NewString()),
			Status:     "settled",
		}, nil
	}

	if req.InvestorID != "" {
		if s.pool != nil {
			uid, err := uuid.Parse(req.InvestorID)
			if err == nil {
				if err := s.chargeDB(ctx, uid, req.AmountIDR); err != nil {
					return nil, err
				}
				return &ChargeResult{
					PaymentRef: fmt.Sprintf("SIM-%s", uuid.NewString()),
					Status:     "settled",
				}, nil
			}
		}

		if err := s.chargeMemory(req.InvestorID, req.AmountIDR); err != nil {
			return nil, err
		}
	}

	return &ChargeResult{
		PaymentRef: fmt.Sprintf("SIM-%s", uuid.NewString()),
		Status:     "settled",
	}, nil
}

func (s *SimulatedProvider) Refund(_ context.Context, _ string, amountIDR int64) error {
	if s.ShouldFail {
		return fmt.Errorf("simulated refund failure")
	}
	return nil
}

func (s *SimulatedProvider) RefundToUser(userID string, amountIDR int64) {
	if userID == "" || amountIDR <= 0 {
		return
	}
	if s.pool != nil {
		uid, err := uuid.Parse(userID)
		if err == nil {
			_, _ = s.pool.Exec(context.Background(), `
				INSERT INTO user_wallets (user_id, balance_idr, updated_at)
				VALUES ($1, $2, NOW())
				ON CONFLICT (user_id) DO UPDATE
				SET balance_idr = user_wallets.balance_idr + $3, updated_at = NOW()
			`, uid, DefaultInitialBalance+amountIDR, amountIDR)
			return
		}
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if s.balances == nil {
		s.balances = make(map[string]int64)
	}
	bal, exists := s.balances[userID]
	if !exists {
		bal = DefaultInitialBalance
	}
	s.balances[userID] = bal + amountIDR
}
