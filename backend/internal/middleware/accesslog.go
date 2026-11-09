package middleware

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
)

func AccessLog() fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		latency := time.Since(start)

		reqID, _ := c.Locals("request_id").(string)

		slog.Info("http request",
			"request_id", reqID,
			"method", c.Method(),
			"path", c.Path(),
			"status", c.Response().StatusCode(),
			"latency_ms", latency.Milliseconds(),
			"ip", c.IP(),
		)

		return err
	}
}
