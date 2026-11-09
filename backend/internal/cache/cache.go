package cache

import (
	"context"
	"errors"
	"time"
)

var (
	ErrNoTTL = errors.New("cache: explicit positive TTL is required for all Set operations (R7.5)")

	ErrMiss = errors.New("cache: key not found")
)

type Cacher interface {
	Get(ctx context.Context, key string) ([]byte, error)
	Set(ctx context.Context, key string, val []byte, ttl time.Duration) error
	Del(ctx context.Context, keys ...string) error
	Close() error
}
