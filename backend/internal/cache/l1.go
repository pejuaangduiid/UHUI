package cache

import (
	"context"
	"sync"
	"time"
)

type l1Item struct {
	expiresAt time.Time
	val       []byte
}

type L1Cache struct {
	items sync.Map
}

func NewL1() *L1Cache {
	c := &L1Cache{}
	go c.janitor()
	return c
}

func (c *L1Cache) Get(_ context.Context, key string) ([]byte, error) {
	val, ok := c.items.Load(key)
	if !ok {
		return nil, ErrMiss
	}
	item := val.(l1Item)
	if time.Now().After(item.expiresAt) {
		c.items.Delete(key)
		return nil, ErrMiss
	}
	return item.val, nil
}

func (c *L1Cache) Set(_ context.Context, key string, val []byte, ttl time.Duration) error {
	if ttl <= 0 {
		return ErrNoTTL
	}
	c.items.Store(key, l1Item{
		val:       val,
		expiresAt: time.Now().Add(ttl),
	})
	return nil
}

func (c *L1Cache) Del(_ context.Context, keys ...string) error {
	for _, k := range keys {
		c.items.Delete(k)
	}
	return nil
}

func (c *L1Cache) Close() error {
	return nil
}

func (c *L1Cache) janitor() {
	ticker := time.NewTicker(30 * time.Second)
	for now := range ticker.C {
		c.items.Range(func(k, v any) bool {
			item := v.(l1Item)
			if now.After(item.expiresAt) {
				c.items.Delete(k)
			}
			return true
		})
	}
}
