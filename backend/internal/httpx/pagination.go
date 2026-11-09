package httpx

import (
	"encoding/base64"
	"errors"
	"strings"
)

var (
	ErrInvalidCursor = errors.New("invalid pagination cursor")
)

type Pagination struct {
	Cursor string `query:"cursor" doc:"Opaque pagination cursor from previous page"`
	Limit  int    `query:"limit" default:"20" doc:"Number of items to return (max 100)"`
}

func (p *Pagination) Normalize() {
	if p.Limit <= 0 {
		p.Limit = 20
	}
	if p.Limit > 100 {
		p.Limit = 100
	}
}

func EncodeCursor(raw string) string {
	if raw == "" {
		return ""
	}
	return base64.RawURLEncoding.EncodeToString([]byte(raw))
}

func DecodeCursor(cursor string) (string, error) {
	if strings.TrimSpace(cursor) == "" {
		return "", nil
	}
	decoded, err := base64.RawURLEncoding.DecodeString(cursor)
	if err != nil {
		return "", ErrInvalidCursor
	}
	return string(decoded), nil
}
