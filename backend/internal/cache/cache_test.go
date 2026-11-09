package cache_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/uhui/backend/internal/cache"
)

func TestR7_5_NoKeyWithoutTTL(t *testing.T) {
	ctx := context.Background()
	l1 := cache.NewL1()

	err := l1.Set(ctx, "test_key", []byte("val"), 0)
	if !errors.Is(err, cache.ErrNoTTL) {
		t.Errorf("expected ErrNoTTL for 0 duration, got %v", err)
	}

	err = l1.Set(ctx, "test_key", []byte("val"), -1*time.Second)
	if !errors.Is(err, cache.ErrNoTTL) {
		t.Errorf("expected ErrNoTTL for negative duration, got %v", err)
	}

	fakeL2 := cache.NewFakeL2(nil)
	err = fakeL2.Set(ctx, "test_key", []byte("val"), 0)
	if !errors.Is(err, cache.ErrNoTTL) {
		t.Errorf("expected ErrNoTTL in FakeL2, got %v", err)
	}
}

func TestR7_6_BudgetGuardBypassesL2(t *testing.T) {
	ctx := context.Background()

	guard := cache.NewBudgetGuard(2)
	fakeL2 := cache.NewFakeL2(guard)

	_ = fakeL2.Set(ctx, "k1", []byte("v1"), time.Minute)

	val, err := fakeL2.Get(ctx, "k1")
	if err != nil || string(val) != "v1" {
		t.Fatalf("expected v1 within budget, got val=%s, err=%v", string(val), err)
	}

	if guard.AllowL2() {
		t.Errorf("expected AllowL2 to be false after 2 commands")
	}

	val, err = fakeL2.Get(ctx, "k1")
	if !errors.Is(err, cache.ErrMiss) {
		t.Errorf("expected ErrMiss when budget exceeded, got %v (val=%s)", err, string(val))
	}
}

func TestR7_6_RedisDownFailOpen(t *testing.T) {
	ctx := context.Background()
	fakeL2 := cache.NewFakeL2(nil)
	fakeL2.SimulateDown = true

	_, err := fakeL2.Get(ctx, "any_key")
	if !errors.Is(err, cache.ErrRedisDown) {
		t.Errorf("expected ErrRedisDown, got %v", err)
	}

	noop := cache.NewNoopL2()
	val, err := noop.Get(ctx, "any_key")
	if !errors.Is(err, cache.ErrMiss) {
		t.Errorf("expected ErrMiss from NoopL2, got %v", err)
	}
	if val != nil {
		t.Errorf("expected nil val from NoopL2, got %s", string(val))
	}
}
