package cache

import (
	"context"
	"time"
)

type NoopL2 struct{}

func NewNoopL2() *NoopL2 {
	return &NoopL2{}
}

func (n *NoopL2) Get(_ context.Context, _ string) ([]byte, error) {
	return nil, ErrMiss
}

func (n *NoopL2) Set(_ context.Context, _ string, _ []byte, ttl time.Duration) error {
	if ttl <= 0 {
		return ErrNoTTL
	}
	return nil
}

func (n *NoopL2) Del(_ context.Context, _ ...string) error {
	return nil
}

func (n *NoopL2) Close() error {
	return nil
}
