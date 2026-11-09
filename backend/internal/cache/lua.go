package cache

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type OCRRateLimiter struct {
	counts map[string]int
	expiry map[string]time.Time
	mu     sync.Mutex
}

func NewOCRRateLimiter() *OCRRateLimiter {
	return &OCRRateLimiter{
		counts: make(map[string]int),
		expiry: make(map[string]time.Time),
	}
}

func (r *OCRRateLimiter) Allow(_ context.Context, userID string) (bool, int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	exp, exists := r.expiry[userID]
	if !exists || now.After(exp) {
		r.counts[userID] = 1
		r.expiry[userID] = now.Add(time.Hour)
		return true, 9, nil
	}

	count := r.counts[userID]
	if count >= 10 {
		return false, 0, fmt.Errorf("rate limit exceeded: 10 scans per hour")
	}

	r.counts[userID] = count + 1
	remaining := 10 - r.counts[userID]
	return true, remaining, nil
}
