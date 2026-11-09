package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/audit"
	"github.com/uhui/backend/internal/db"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

var slugRegex = regexp.MustCompile(`[^a-z0-9]+`)

type Service struct {
	pool *pgxpool.Pool
	tm   *middleware.TokenManager
}

func NewService(pool *pgxpool.Pool, tm *middleware.TokenManager) *Service {
	return &Service{
		pool: pool,
		tm:   tm,
	}
}

type RegisterInput struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	FullName     string `json:"full_name"`
	Role         string `json:"role"`
	BusinessName string `json:"business_name,omitempty"`
	Sector       string `json:"sector,omitempty"`
	PdpConsent   bool   `json:"pdp_consent"`
}

type AuthResult struct {
	AccessToken  string
	RefreshToken string
	SMEID        string
	User         gen.User
}

func (s *Service) Register(ctx context.Context, in RegisterInput) (*AuthResult, error) {
	cleanRole, err := validateRegisterInput(in)
	if err != nil {
		return nil, err
	}

	hashedPassword, err := HashPassword(in.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	rawRefresh, refreshHash, err := generateRefreshToken()
	if err != nil {
		return nil, err
	}

	var result AuthResult
	err = db.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.execRegisterTx(ctx, tx, in, cleanRole, hashedPassword, refreshHash, &result)
	})
	if err != nil {
		return nil, err
	}

	accessToken, err := s.tm.SignAccess(uuidToString(result.User.ID), cleanRole)
	if err != nil {
		return nil, fmt.Errorf("sign access token: %w", err)
	}

	result.AccessToken = accessToken
	result.RefreshToken = rawRefresh

	meCacheLock.Lock()
	meCacheMap[uuidToString(result.User.ID)] = meCacheEntry{
		expiresAt: time.Now().Add(60 * time.Second),
		user:      &result.User,
		smeID:     result.SMEID,
	}
	meCacheLock.Unlock()

	return &result, nil
}

func validateRegisterInput(in RegisterInput) (string, error) {
	if !in.PdpConsent {
		return "", apperr.BadRequest(apperr.CodePdpConsentRequired, "Persetujuan PDP wajib dicentang", "Centang kotak persetujuan")
	}

	role := strings.ToLower(strings.TrimSpace(in.Role))
	if role == "" {
		role = "sme_owner"
	}
	if role != "sme_owner" && role != "investor" {
		return "", apperr.BadRequest(apperr.CodeInvalidRole, "Pilihan peran tidak valid", "Pilih sme_owner atau investor")
	}

	return role, nil
}

func (s *Service) execRegisterTx(ctx context.Context, tx pgx.Tx, in RegisterInput, role, passHash string, refreshHash []byte, out *AuthResult) error {
	queries := gen.New(tx)
	user, err := queries.CreateUser(ctx, gen.CreateUserParams{
		Email:        strings.ToLower(strings.TrimSpace(in.Email)),
		PasswordHash: passHash,
		FullName:     strings.TrimSpace(in.FullName),
		Role:         gen.UserRole(role),
		PdpConsentAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	if err != nil {
		if strings.Contains(err.Error(), "users_email_key") {
			return apperr.Conflict(apperr.CodeEmailAlreadyExists, "Email sudah terdaftar", "Gunakan email lain")
		}
		return fmt.Errorf("create user: %w", err)
	}
	out.User = user

	if strings.TrimSpace(in.BusinessName) != "" {
		sector := strings.TrimSpace(in.Sector)
		if sector == "" {
			sector = "Umum"
		}
		var sme gen.Sme
		sme, err = queries.CreateSME(ctx, gen.CreateSMEParams{
			OwnerID:          user.ID,
			BusinessName:     strings.TrimSpace(in.BusinessName),
			Slug:             generateSlug(in.BusinessName),
			Sector:           sector,
			AiInterval:       gen.AiScheduleInterval14Days,
			NextAiAnalysisAt: pgtype.Timestamptz{Time: time.Now().Add(14 * 24 * time.Hour), Valid: true},
		})
		if err != nil {
			return fmt.Errorf("create sme: %w", err)
		}
		out.SMEID = uuidToString(sme.ID)
	}

	_, err = queries.CreateRefreshToken(ctx, gen.CreateRefreshTokenParams{
		UserID:    user.ID,
		FamilyID:  user.ID,
		TokenHash: refreshHash,
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(30 * 24 * time.Hour), Valid: true},
	})
	if err != nil {
		return fmt.Errorf("create refresh token: %w", err)
	}

	_, _ = audit.Record(ctx, tx, audit.Event{
		ActorID:  user.ID,
		Action:   audit.ActionLogin,
		Entity:   "users",
		EntityID: user.ID,
		Meta:     map[string]any{"type": "register", "role": role},
	})
	return nil
}

func (s *Service) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	queries := gen.New(s.pool)
	user, err := queries.GetUserByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		return nil, apperr.Unauthorized(apperr.CodeInvalidCredentials, "Email atau kata sandi salah", "Periksa data login Anda")
	}

	match, err := ComparePassword(password, user.PasswordHash)
	if err != nil || !match {
		return nil, apperr.Unauthorized(apperr.CodeInvalidCredentials, "Email atau kata sandi salah", "Periksa data login Anda")
	}

	rawRefresh, refreshHash, err := generateRefreshToken()
	if err != nil {
		return nil, err
	}

	smeID := s.resolveSMEID(ctx, user)

	err = db.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		return saveNewSession(ctx, tx, user.ID, refreshHash)
	})
	if err != nil {
		return nil, fmt.Errorf("save session: %w", err)
	}

	accessToken, err := s.tm.SignAccess(uuidToString(user.ID), string(user.Role))
	if err != nil {
		return nil, fmt.Errorf("sign access token: %w", err)
	}

	meCacheLock.Lock()
	meCacheMap[uuidToString(user.ID)] = meCacheEntry{
		expiresAt: time.Now().Add(60 * time.Second),
		user:      &user,
		smeID:     smeID,
	}
	meCacheLock.Unlock()

	return &AuthResult{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		User:         user,
		SMEID:        smeID,
	}, nil
}

func (s *Service) resolveSMEID(ctx context.Context, user gen.User) string {
	if user.Role != gen.UserRoleSmeOwner {
		return ""
	}
	queries := gen.New(s.pool)
	if sme, err := queries.GetSMEByOwnerID(ctx, user.ID); err == nil {
		return uuidToString(sme.ID)
	}
	return ""
}

func saveNewSession(ctx context.Context, tx pgx.Tx, userID pgtype.UUID, refreshHash []byte) error {
	var familyID pgtype.UUID
	var randBytes [16]byte
	_, _ = rand.Read(randBytes[:])
	_ = familyID.Scan(hex.EncodeToString(randBytes[:]))

	txQueries := gen.New(tx)
	_, err := txQueries.CreateRefreshToken(ctx, gen.CreateRefreshTokenParams{
		UserID:    userID,
		FamilyID:  familyID,
		TokenHash: refreshHash,
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(30 * 24 * time.Hour), Valid: true},
	})
	if err != nil {
		return err
	}

	_, _ = audit.Record(ctx, tx, audit.Event{
		ActorID:  userID,
		Action:   audit.ActionLogin,
		Entity:   "users",
		EntityID: userID,
		Meta:     map[string]any{"type": "login"},
	})
	return nil
}

func (s *Service) Refresh(ctx context.Context, rawToken string) (*AuthResult, error) {
	if strings.TrimSpace(rawToken) == "" {
		return nil, apperr.Unauthorized(apperr.CodeUnauthorized, "Refresh token tidak ditemukan", "Silakan login")
	}

	tokenRow, err := s.lookupRefreshToken(ctx, rawToken)
	if err != nil {
		return nil, err
	}

	queries := gen.New(s.pool)
	user, err := queries.GetUserByID(ctx, tokenRow.UserID)
	if err != nil {
		return nil, apperr.Unauthorized(apperr.CodeUserNotFound, "Pengguna tidak ditemukan", "Silakan login")
	}

	newRaw, newHash, err := generateRefreshToken()
	if err != nil {
		return nil, err
	}

	err = db.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		txQueries := gen.New(tx)
		if revokeErr := txQueries.RevokeToken(ctx, tokenRow.ID); revokeErr != nil {
			return revokeErr
		}
		_, createErr := txQueries.CreateRefreshToken(ctx, gen.CreateRefreshTokenParams{
			UserID:    tokenRow.UserID,
			FamilyID:  tokenRow.FamilyID,
			TokenHash: newHash,
			ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(30 * 24 * time.Hour), Valid: true},
		})
		return createErr
	})
	if err != nil {
		return nil, fmt.Errorf("rotate token: %w", err)
	}

	accessToken, err := s.tm.SignAccess(uuidToString(user.ID), string(user.Role))
	if err != nil {
		return nil, fmt.Errorf("sign access token: %w", err)
	}

	smeID := s.resolveSMEID(ctx, user)
	meCacheLock.Lock()
	meCacheMap[uuidToString(user.ID)] = meCacheEntry{
		expiresAt: time.Now().Add(60 * time.Second),
		user:      &user,
		smeID:     smeID,
	}
	meCacheLock.Unlock()

	return &AuthResult{
		AccessToken:  accessToken,
		RefreshToken: newRaw,
		User:         user,
		SMEID:        smeID,
	}, nil
}

func (s *Service) lookupRefreshToken(ctx context.Context, rawToken string) (*gen.RefreshToken, error) {
	hash := sha256.Sum256([]byte(rawToken))
	queries := gen.New(s.pool)
	tokenRow, err := queries.GetRefreshTokenByHash(ctx, hash[:])
	if err != nil {
		return nil, apperr.Unauthorized(apperr.CodeUnauthorized, "Refresh token tidak valid", "Silakan login")
	}

	if tokenRow.RevokedAt.Valid {
		_ = queries.RevokeTokenFamily(ctx, tokenRow.FamilyID)
		return nil, apperr.Unauthorized(apperr.CodeTokenReused, "Token reuse terdeteksi", "Silakan login kembali")
	}

	if time.Now().After(tokenRow.ExpiresAt.Time) {
		return nil, apperr.Unauthorized(apperr.CodeTokenExpired, "Refresh token kedaluwarsa", "Silakan login")
	}

	return &tokenRow, nil
}

func (s *Service) Logout(ctx context.Context, rawToken string) error {
	if strings.TrimSpace(rawToken) == "" {
		return nil
	}
	hash := sha256.Sum256([]byte(rawToken))
	queries := gen.New(s.pool)
	tokenRow, err := queries.GetRefreshTokenByHash(ctx, hash[:])
	if err == nil {
		_ = queries.RevokeToken(ctx, tokenRow.ID)
		meCacheLock.Lock()
		delete(meCacheMap, uuidToString(tokenRow.UserID))
		meCacheLock.Unlock()
	}
	return nil
}

type meCacheEntry struct {
	expiresAt time.Time
	user      *gen.User
	smeID     string
}

var (
	meCacheLock sync.RWMutex
	meCacheMap  = make(map[string]meCacheEntry)
)

func (s *Service) GetMe(ctx context.Context, userIDStr string) (*gen.User, string, error) {
	meCacheLock.RLock()
	if entry, ok := meCacheMap[userIDStr]; ok && time.Now().Before(entry.expiresAt) {
		meCacheLock.RUnlock()
		return entry.user, entry.smeID, nil
	}
	meCacheLock.RUnlock()

	var uid pgtype.UUID
	if err := uid.Scan(userIDStr); err != nil {
		return nil, "", apperr.BadRequest(apperr.CodeBadRequest, "Invalid user ID", "")
	}

	queries := gen.New(s.pool)
	user, err := queries.GetUserByID(ctx, uid)
	if err != nil {
		return nil, "", apperr.NotFound(apperr.CodeUserNotFound, "User tidak ditemukan", "")
	}

	smeID := s.resolveSMEID(ctx, user)
	meCacheLock.Lock()
	meCacheMap[userIDStr] = meCacheEntry{
		expiresAt: time.Now().Add(60 * time.Second),
		user:      &user,
		smeID:     smeID,
	}
	meCacheLock.Unlock()
	return &user, smeID, nil
}

func generateRefreshToken() (string, []byte, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", nil, fmt.Errorf("generate token: %w", err)
	}
	raw := hex.EncodeToString(b)
	hash := sha256.Sum256([]byte(raw))
	return raw, hash[:], nil
}

func generateSlug(name string) string {
	clean := strings.ToLower(strings.TrimSpace(name))
	slug := slugRegex.ReplaceAllString(clean, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "usaha"
	}
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%s-%x", slug, b)
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	src := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", src[0:4], src[4:6], src[6:8], src[8:10], src[10:16])
}
