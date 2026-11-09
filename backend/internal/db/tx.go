package db

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DBTX interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

func WithTx(ctx context.Context, pool *pgxpool.Pool, fn func(tx pgx.Tx) error) error {
	const maxRetries = 3
	var err error

	for attempt := 0; attempt < maxRetries; attempt++ {
		err = runTx(ctx, pool, fn)
		if err == nil {
			return nil
		}

		if isRetryable(err) {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(time.Duration(attempt+1) * 20 * time.Millisecond):
				continue
			}
		}
		return err
	}
	return err
}

func runTx(ctx context.Context, pool *pgxpool.Pool, fn func(tx pgx.Tx) error) (err error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback(ctx)
			panic(p)
		} else if err != nil {
			_ = tx.Rollback(ctx)
		} else {
			err = tx.Commit(ctx)
		}
	}()

	err = fn(tx)
	return err
}

func isRetryable(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "40001" || pgErr.Code == "40P01"
	}
	return false
}
