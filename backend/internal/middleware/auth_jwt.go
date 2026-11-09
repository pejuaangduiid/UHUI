package middleware

import (
	"context"
	"crypto/ed25519"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/config"
)

type contextKey string

const PrincipalContextKey contextKey = "principal"

var (
	ErrInvalidToken = errors.New("invalid or expired token")
)

type Principal struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

type TokenClaims struct {
	jwt.RegisteredClaims
	Role string `json:"role"`
}

type TokenManager struct {
	privKey ed25519.PrivateKey
	pubKey  ed25519.PublicKey
}

func NewTokenManager(privBytes, pubBytes []byte) (*TokenManager, error) {
	if len(privBytes) == ed25519.PrivateKeySize && len(pubBytes) == ed25519.PublicKeySize {
		return &TokenManager{
			privKey: ed25519.PrivateKey(privBytes),
			pubKey:  ed25519.PublicKey(pubBytes),
		}, nil
	}

	devSeed := make([]byte, ed25519.SeedSize)
	copy(devSeed, []byte("uhui-dev-jwt-ed25519-seed-fixed!"))
	priv := ed25519.NewKeyFromSeed(devSeed)
	pub := priv.Public().(ed25519.PublicKey)
	slog.Info("using deterministic Ed25519 keypair for dev auth")
	return &TokenManager{
		privKey: priv,
		pubKey:  pub,
	}, nil
}

func (tm *TokenManager) SignAccess(userID, role string) (string, error) {
	claims := TokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
		Role: role,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	return token.SignedString(tm.privKey)
}

func (tm *TokenManager) VerifyAccess(tokenStr string) (*Principal, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &TokenClaims{}, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodEdDSA {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return tm.pubKey, nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || claims.Subject == "" {
		return nil, ErrInvalidToken
	}

	return &Principal{
		UserID: claims.Subject,
		Role:   claims.Role,
	}, nil
}

func isAuthExemptPath(path string) bool {
	switch path {
	case "/api/v1/auth/login",
		"/api/v1/auth/register",
		"/api/v1/auth/refresh",
		"/api/v1/auth/logout",
		"/api/v1/auth/forgot-password",
		"/api/v1/auth/reset-password":
		return true
	default:
		return false
	}
}

func getCookieValue(c fiber.Ctx, primary, fallback string) string {
	v := c.Cookies(primary)
	if v == "" && fallback != "" {
		return c.Cookies(fallback)
	}
	return v
}

func AuthJWT(tm *TokenManager, cfg *config.Config, required bool) fiber.Handler {
	accessCookieName := AccessCookieName(cfg)
	refreshCookieName := RefreshCookieName(cfg)
	return func(c fiber.Ctx) error {
		if isAuthExemptPath(c.Path()) {
			return c.Next()
		}

		accessVal := getCookieValue(c, accessCookieName, "uhui_access")
		refreshVal := getCookieValue(c, refreshCookieName, "uhui_refresh")

		if accessVal == "" {
			if refreshVal != "" {
				return c.Status(http.StatusUnauthorized).JSON(apperr.NewProblemDetails(
					apperr.Unauthorized(apperr.CodeTokenExpired, "Sesi kedaluwarsa", "Silakan refresh token"),
				))
			}
			if required {
				return c.Status(http.StatusUnauthorized).JSON(apperr.NewProblemDetails(
					apperr.Unauthorized(apperr.CodeUnauthorized, "Sesi tidak ditemukan", "Silakan login terlebih dahulu"),
				))
			}
			return c.Next()
		}

		p, err := tm.VerifyAccess(accessVal)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(apperr.NewProblemDetails(
				apperr.Unauthorized(apperr.CodeTokenExpired, "Sesi kedaluwarsa atau tidak valid", "Silakan refresh atau login kembali"),
			))
		}

		c.Locals("principal", p)
		c.SetContext(context.WithValue(c.Context(), PrincipalContextKey, p))
		return c.Next()
	}
}

func GetPrincipal(ctx context.Context) (*Principal, bool) {
	p, ok := ctx.Value(PrincipalContextKey).(*Principal)
	return p, ok
}

func AccessCookieName(cfg *config.Config) string {
	if cfg.CookieInsecure && cfg.IsDev() {
		return "uhui_access"
	}
	return "__Host-access"
}

func RefreshCookieName(cfg *config.Config) string {
	if cfg.CookieInsecure && cfg.IsDev() {
		return "uhui_refresh"
	}
	return "__Secure-refresh"
}
