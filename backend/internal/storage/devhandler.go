package storage

import (
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

func RegisterDevStorageHandler(app *fiber.App, fs *LocalFSStorage) {
	app.Get("/api/v1/storage/dev/*", func(c fiber.Ctx) error {
		key := c.Params("*")
		expiresStr := c.Query("expires")
		sig := c.Query("sig")

		expires, err := strconv.ParseInt(expiresStr, 10, 64)
		if err != nil || !fs.ValidateSig(key, expires, sig) {
			return c.Status(http.StatusForbidden).SendString("Invalid or expired signed URL")
		}

		rc, ctype, err := fs.Get(c.Context(), key)
		if err != nil {
			if errors.Is(err, ErrObjectNotFound) {
				return c.Status(http.StatusNotFound).SendString("Object not found")
			}
			return c.Status(http.StatusInternalServerError).SendString(err.Error())
		}
		defer func() { _ = rc.Close() }()

		c.Set("Content-Type", ctype)
		c.Set("Cache-Control", "private, no-cache")

		data, err := io.ReadAll(rc)
		if err != nil {
			return c.Status(http.StatusInternalServerError).SendString("Error reading file")
		}
		return c.Send(data)
	})
}
