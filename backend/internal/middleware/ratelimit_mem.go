package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/uhui/backend/internal/apperr"
)

type rateLimitEntry struct {
	resetTime time.Time
	count     int
}

type MemoryRateLimiter struct {
	limits   map[string]*rateLimitEntry
	maxReq   int
	duration time.Duration
	mu       sync.Mutex
}

func NewMemoryRateLimiter(maxRequests int, window time.Duration) *MemoryRateLimiter {
	l := &MemoryRateLimiter{
		limits:   make(map[string]*rateLimitEntry),
		maxReq:   maxRequests,
		duration: window,
	}
	go l.janitor()
	return l
}

func (l *MemoryRateLimiter) Handler() fiber.Handler {
	return func(c fiber.Ctx) error {
		ip := c.IP()

		l.mu.Lock()
		now := time.Now()
		entry, exists := l.limits[ip]
		if !exists || now.After(entry.resetTime) {
			l.limits[ip] = &rateLimitEntry{
				count:     1,
				resetTime: now.Add(l.duration),
			}
			l.mu.Unlock()
			return c.Next()
		}

		if entry.count >= l.maxReq {
			l.mu.Unlock()
			return c.Status(http.StatusTooManyRequests).JSON(apperr.NewProblemDetails(
				apperr.New(apperr.CodeRateLimitExceeded, http.StatusTooManyRequests, "Terlalu banyak permintaan", "Silakan tunggu sebelum mencoba kembali"),
			))
		}

		entry.count++
		l.mu.Unlock()
		return c.Next()
	}
}

func (l *MemoryRateLimiter) janitor() {
	ticker := time.NewTicker(time.Minute)
	for now := range ticker.C {
		l.mu.Lock()
		for ip, entry := range l.limits {
			if now.After(entry.resetTime) {
				delete(l.limits, ip)
			}
		}
		l.mu.Unlock()
	}
}
