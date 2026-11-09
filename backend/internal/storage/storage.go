package storage

import (
	"context"
	"errors"
	"io"
	"time"
)

var (
	ErrObjectNotFound = errors.New("storage: object not found")
	ErrInvalidTTL     = errors.New("storage: signed URL TTL must be <= 5 minutes (R8.4)")
)

type StorageProvider interface {
	Put(ctx context.Context, key string, data io.Reader, size int64, contentType string) error
	Get(ctx context.Context, key string) (io.ReadCloser, string, error)
	Move(ctx context.Context, srcKey, destKey string) error
	Delete(ctx context.Context, key string) error
	SignedURL(ctx context.Context, key string, ttl time.Duration) (string, error)
	ListExpired(ctx context.Context, prefix string, olderThan time.Duration) ([]string, error)
}
