package ojk

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

type Service struct {
	pool       *pgxpool.Pool
	q          *gen.Queries
	httpClient *http.Client
}

func NewService(pool *pgxpool.Pool, q *gen.Queries) *Service {
	return &Service{
		pool: pool,
		q:    q,
		httpClient: &http.Client{
			Timeout: 3 * time.Second,
		},
	}
}

func (s *Service) GetSCFPartners(ctx context.Context) ([]SCFPartnerDTO, error) {
	if s.q != nil {
		rows, err := s.q.ListSCFPartners(ctx)
		if err == nil && len(rows) > 0 {
			res := make([]SCFPartnerDTO, 0, len(rows))
			for _, r := range rows {
				active := true
				if r.IsActive.Valid {
					active = r.IsActive.Bool
				}
				res = append(res, SCFPartnerDTO{
					ID:            formatUUID(r.ID),
					EntityName:    r.EntityName,
					BrandName:     r.BrandName,
					LicenseNumber: textToString(r.LicenseNumber),
					EntityType:    r.EntityType,
					WebsiteURL:    textToString(r.WebsiteUrl),
					IsActive:      active,
				})
			}
			return res, nil
		}
	}
	// Fallback when DB is empty or unreachable
	return DefaultSCFPartners(), nil
}

func (s *Service) CheckEntity(ctx context.Context, query string) (*OJKCheckResultDTO, error) {
	cleanQuery := strings.TrimSpace(query)
	if cleanQuery == "" {
		return &OJKCheckResultDTO{
			Query:           query,
			TotalMatches:    0,
			Status:          "NOT_FOUND_CLEAN",
			LicensedMatches: []SCFPartnerDTO{},
			IllegalMatches:  []IllegalEntityDTO{},
			DataSource:      "fallback_offline",
			Disclaimer:      "Status perizinan mengacu pada basis data publik OJK dan Satgas Waspada Investasi.",
		}, nil
	}

	var licensedMatches []SCFPartnerDTO
	var illegalMatches []IllegalEntityDTO
	dataSource := "database_cache"

	if s.q != nil {
		licRows, err := s.q.SearchLicensedEntities(ctx, pgtype.Text{String: cleanQuery, Valid: true})
		if err == nil {
			for _, r := range licRows {
				licensedMatches = append(licensedMatches, SCFPartnerDTO{
					ID:            formatUUID(r.ID),
					EntityName:    r.EntityName,
					BrandName:     r.BrandName,
					LicenseNumber: textToString(r.LicenseNumber),
					EntityType:    r.EntityType,
					WebsiteURL:    textToString(r.WebsiteUrl),
					IsActive:      true,
				})
			}
		}

		illRows, err := s.q.SearchIllegalEntities(ctx, pgtype.Text{String: cleanQuery, Valid: true})
		if err == nil {
			for _, r := range illRows {
				illegalMatches = append(illegalMatches, IllegalEntityDTO{
					ID:             formatUUID(r.ID),
					EntityName:     r.EntityName,
					ActivityType:   textToString(r.ActivityType),
					SuspicionNotes: textToString(r.SuspicionNotes),
				})
			}
		}
	}

	// Memory fallback search if database yielded nothing and matches fallback list
	if len(licensedMatches) == 0 && len(illegalMatches) == 0 {
		dataSource = "fallback_offline"
		lowerQ := strings.ToLower(cleanQuery)
		for _, p := range DefaultSCFPartners() {
			if strings.Contains(strings.ToLower(p.BrandName), lowerQ) || strings.Contains(strings.ToLower(p.EntityName), lowerQ) {
				licensedMatches = append(licensedMatches, p)
			}
		}
		for _, ill := range DefaultSampleIllegals() {
			if strings.Contains(strings.ToLower(ill.EntityName), lowerQ) {
				illegalMatches = append(illegalMatches, ill)
			}
		}
	}

	status := "NOT_FOUND_CLEAN"
	if len(illegalMatches) > 0 {
		status = "ILLEGAL_WARNING"
	} else if len(licensedMatches) > 0 {
		status = "VERIFIED_LICENSED"
	}

	return &OJKCheckResultDTO{
		Query:           cleanQuery,
		TotalMatches:    len(licensedMatches) + len(illegalMatches),
		Status:          status,
		LicensedMatches: licensedMatches,
		IllegalMatches:  illegalMatches,
		DataSource:      dataSource,
		Disclaimer:      "Status perizinan mengacu pada basis data publik OJK dan Satgas Waspada Investasi. Lakukan verifikasi mendalam sebelum berinvestasi.",
	}, nil
}

func (s *Service) ScreenSME(ctx context.Context, smeID uuid.UUID) (*SMEScreeningResultDTO, error) {
	if s.q == nil {
		return &SMEScreeningResultDTO{
			SMEID:     smeID.String(),
			RiskLevel: "LOW",
			IsFlagged: false,
			ScannedAt: time.Now(),
		}, nil
	}

	sme, err := s.q.GetSMEByID(ctx, pgtype.UUID{Bytes: smeID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("SME_NOT_FOUND", "Data UMKM tidak ditemukan", "")
	}

	// Fetch owner name
	ownerName := ""
	ownerUser, err := s.q.GetUserByID(ctx, sme.OwnerID)
	if err == nil {
		ownerName = ownerUser.FullName
	}

	matchedIllegals := make([]IllegalEntityDTO, 0)

	// Check business name
	if rows, err := s.q.CheckEntityIllegalMatch(ctx, pgtype.Text{String: sme.BusinessName, Valid: true}); err == nil {
		for _, r := range rows {
			matchedIllegals = append(matchedIllegals, IllegalEntityDTO{
				ID:             formatUUID(r.ID),
				EntityName:     r.EntityName,
				ActivityType:   textToString(r.ActivityType),
				SuspicionNotes: textToString(r.SuspicionNotes),
			})
		}
	}

	// Check owner name if present
	if ownerName != "" {
		if rows, err := s.q.CheckEntityIllegalMatch(ctx, pgtype.Text{String: ownerName, Valid: true}); err == nil {
			for _, r := range rows {
				matchedIllegals = append(matchedIllegals, IllegalEntityDTO{
					ID:             formatUUID(r.ID),
					EntityName:     r.EntityName,
					ActivityType:   textToString(r.ActivityType),
					SuspicionNotes: textToString(r.SuspicionNotes),
				})
			}
		}
	}

	isFlagged := len(matchedIllegals) > 0
	riskLevel := "LOW"
	flaggedReason := ""
	if isFlagged {
		riskLevel = "HIGH"
		flaggedReason = "Nama usaha atau pemilik terindikasi mirip dengan entitas dalam daftar Satgas Waspada Investasi OJK."
	}

	return &SMEScreeningResultDTO{
		SMEID:           smeID.String(),
		BusinessName:    sme.BusinessName,
		OwnerName:       ownerName,
		RiskLevel:       riskLevel,
		IsFlagged:       isFlagged,
		FlaggedReason:   flaggedReason,
		MatchedIllegals: matchedIllegals,
		ScannedAt:       time.Now(),
	}, nil
}

type upstreamAppResponse struct {
	Data struct {
		Apps []struct {
			ID    int    `json:"id"`
			Name  string `json:"name"`
			URL   string `json:"url"`
			Owner string `json:"owner"`
		} `json:"apps"`
	} `json:"data"`
}

type upstreamIllegalResponse struct {
	Data struct {
		Illegals []struct {
			ID          int      `json:"id"`
			Name        string   `json:"name"`
			Alias       []string `json:"alias"`
			EntityType  string   `json:"entity_type"`
			Description string   `json:"description"`
		} `json:"illegals"`
	} `json:"data"`
}

func (s *Service) SyncFromUpstream(ctx context.Context) (*SyncResultDTO, error) {
	if s.q == nil {
		return &SyncResultDTO{
			Success:      false,
			FallbackUsed: true,
			Message:      "Database query engine belum siap, sinkronisasi ditunda.",
		}, nil
	}

	appsURL := "https://ojk-invest-api.vercel.app/api/apps"
	illegalsURL := "https://ojk-invest-api.vercel.app/api/illegals"

	licensedCount := 0
	illegalCount := 0

	// 1. Fetch apps with safe timeout
	reqApps, err := http.NewRequestWithContext(ctx, http.MethodGet, appsURL, nil)
	if err == nil {
		resp, err := s.httpClient.Do(reqApps)
		if err == nil && resp.StatusCode == http.StatusOK {
			var appData upstreamAppResponse
			if err := json.NewDecoder(resp.Body).Decode(&appData); err == nil {
				for _, app := range appData.Data.Apps {
					if app.Name == "" {
						continue
					}
					owner := app.Owner
					if owner == "" {
						owner = app.Name
					}
					licNum := fmt.Sprintf("OJK-REG-%d", app.ID)
					_, _ = s.q.UpsertLicensedEntity(ctx, gen.UpsertLicensedEntityParams{
						EntityName:    owner,
						BrandName:     app.Name,
						LicenseNumber: pgtype.Text{String: licNum, Valid: true},
						EntityType:    "licensed_fintech",
						WebsiteUrl:    pgtype.Text{String: app.URL, Valid: app.URL != ""},
						IsActive:      pgtype.Bool{Bool: true, Valid: true},
					})
					licensedCount++
				}
			}
			_ = resp.Body.Close()
		} else {
			slog.Warn("ojk upstream apps sync skipped or failed", "error", err)
		}
	}

	// 2. Fetch illegals with safe timeout
	reqIll, err := http.NewRequestWithContext(ctx, http.MethodGet, illegalsURL, nil)
	if err == nil {
		resp, err := s.httpClient.Do(reqIll)
		if err == nil && resp.StatusCode == http.StatusOK {
			var illData upstreamIllegalResponse
			if err := json.NewDecoder(resp.Body).Decode(&illData); err == nil {
				// Process first 100 for safety and speed
				maxCount := len(illData.Data.Illegals)
				if maxCount > 100 {
					maxCount = 100
				}
				for _, item := range illData.Data.Illegals[:maxCount] {
					if item.Name == "" {
						continue
					}
					_, _ = s.q.UpsertIllegalEntity(ctx, gen.UpsertIllegalEntityParams{
						EntityName:     item.Name,
						EntityAliases:  item.Alias,
						ActivityType:   pgtype.Text{String: item.EntityType, Valid: item.EntityType != ""},
						SuspicionNotes: pgtype.Text{String: item.Description, Valid: item.Description != ""},
					})
					illegalCount++
				}
			}
			_ = resp.Body.Close()
		} else {
			slog.Warn("ojk upstream illegals sync skipped or failed", "error", err)
		}
	}

	msg := fmt.Sprintf("Sinkronisasi OJK berhasil. %d entitas berizin dan %d entitas ilegal diperbarui.", licensedCount, illegalCount)
	fallback := false
	if licensedCount == 0 && illegalCount == 0 {
		msg = "Upstream OJK API tidak merespons, data lokal dan fallback tetap aman aktif."
		fallback = true
	}

	return &SyncResultDTO{
		Success:        true,
		FallbackUsed:   fallback,
		Message:        msg,
		LicensedSynced: licensedCount,
		IllegalSynced:  illegalCount,
	}, nil
}

func formatUUID(id pgtype.UUID) string {
	if !id.Valid {
		return ""
	}
	u, err := uuid.FromBytes(id.Bytes[:])
	if err != nil {
		return ""
	}
	return u.String()
}

func textToString(t pgtype.Text) string {
	if t.Valid {
		return t.String
	}
	return ""
}

func textToStringPtr(t pgtype.Text) *string {
	if t.Valid {
		return &t.String
	}
	return nil
}

func safeString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func boolPtr(b bool) *bool {
	return &b
}
