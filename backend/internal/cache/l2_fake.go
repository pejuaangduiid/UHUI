package cache

import (
	"context"
	"errors"
	"sync"
	"time"
)

var ErrRedisDown = errors.New("redis connection refused")

type FakeL2 struct {
	store        map[string]l1Item
	guard        *BudgetGuard
	mu           sync.RWMutex
	SimulateDown bool
}

func NewFakeL2(guard *BudgetGuard) *FakeL2 {
	return &FakeL2{
		store: make(map[string]l1Item),
		guard: guard,
	}
}

func (f *FakeL2) Get(_ context.Context, key string) ([]byte, error) {
	if f.SimulateDown {
		return nil, ErrRedisDown
	}
	if f.guard != nil && !f.guard.AllowL2() {
		return nil, ErrMiss
	}
	if f.guard != nil {
		f.guard.RecordCommand()
	}

	f.mu.RLock()
	defer f.mu.RUnlock()

	item, ok := f.store[key]
	if !ok || time.Now().After(item.expiresAt) {
		return nil, ErrMiss
	}
	return item.val, nil
}

func (f *FakeL2) Set(_ context.Context, key string, val []byte, ttl time.Duration) error {
	if ttl <= 0 {
		return ErrNoTTL
	}
	if f.SimulateDown {
		return ErrRedisDown
	}
	if f.guard != nil && !f.guard.AllowL2() {
		return nil
	}
	if f.guard != nil {
		f.guard.RecordCommand()
	}

	f.mu.Lock()
	defer f.mu.Unlock()

	f.store[key] = l1Item{
		val:       val,
		expiresAt: time.Now().Add(ttl),
	}
	return nil
}

func (f *FakeL2) Del(_ context.Context, keys ...string) error {
	if f.SimulateDown {
		return ErrRedisDown
	}
	if f.guard != nil && !f.guard.AllowL2() {
		return nil
	}
	if f.guard != nil {
		f.guard.RecordCommand()
	}

	f.mu.Lock()
	defer f.mu.Unlock()

	for _, k := range keys {
		delete(f.store, k)
	}
	return nil
}

func (f *FakeL2) Close() error {
	return nil
}
