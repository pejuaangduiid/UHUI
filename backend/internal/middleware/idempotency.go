package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"

	"github.com/gofiber/fiber/v3"
	"github.com/uhui/backend/internal/apperr"
)

const HeaderIdempotencyKey = "Idempotency-Key"

const (
	CtxKeyIdempotencyKey = "idempotency_key"
	CtxKeyRequestHash    = "request_hash"
)

func ValidateIdempotencyKey(key string) error {
	if len(key) < 1 || len(key) > 128 {
		return apperr.BadRequest("INVALID_IDEMPOTENCY_KEY", "Idempotency-Key header must be between 1 and 128 characters", "Provide a valid UUID or client token in Idempotency-Key")
	}
	return nil
}

func HashPayload(payload []byte) string {
	h := sha256.Sum256(payload)
	return hex.EncodeToString(h[:])
}

func RequireIdempotencyKey() fiber.Handler {
	return func(c fiber.Ctx) error {
		key := c.Get(HeaderIdempotencyKey)
		if err := ValidateIdempotencyKey(key); err != nil {
			return c.Status(http.StatusBadRequest).JSON(apperr.NewProblemDetails(err.(*apperr.Error)))
		}

		hash := HashPayload(c.Body())
		c.Locals(CtxKeyIdempotencyKey, key)
		c.Locals(CtxKeyRequestHash, hash)
		return c.Next()
	}
}
