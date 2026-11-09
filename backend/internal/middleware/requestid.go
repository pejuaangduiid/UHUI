package middleware

import (
	"crypto/rand"
	"fmt"

	"github.com/gofiber/fiber/v3"
)

const HeaderRequestID = "X-Request-ID"

func RequestID() fiber.Handler {
	return func(c fiber.Ctx) error {
		reqID := c.Get(HeaderRequestID)
		if reqID == "" {
			reqID = generateUUID()
			c.Request().Header.Set(HeaderRequestID, reqID)
		}
		c.Set(HeaderRequestID, reqID)
		c.Locals("request_id", reqID)
		return c.Next()
	}
}

func generateUUID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
