package ojk

import "time"

type SCFPartnerDTO struct {
	ID            string `json:"id"`
	EntityName    string `json:"entity_name"`
	BrandName     string `json:"brand_name"`
	LicenseNumber string `json:"license_number"`
	EntityType    string `json:"entity_type"`
	WebsiteURL    string `json:"website_url"`
	IsActive      bool   `json:"is_active"`
}

type IllegalEntityDTO struct {
	ID             string `json:"id"`
	EntityName     string `json:"entity_name"`
	ActivityType   string `json:"activity_type"`
	SuspicionNotes string `json:"suspicion_notes"`
}

type OJKCheckResultDTO struct {
	Query           string             `json:"query"`
	TotalMatches    int                `json:"total_matches"`
	Status          string             `json:"status"` // "VERIFIED_LICENSED" | "ILLEGAL_WARNING" | "NOT_FOUND_CLEAN"
	LicensedMatches []SCFPartnerDTO    `json:"licensed_matches"`
	IllegalMatches  []IllegalEntityDTO `json:"illegal_matches"`
	DataSource      string             `json:"data_source"`
	Disclaimer      string             `json:"disclaimer"`
}

type SMEScreeningResultDTO struct {
	SMEID           string             `json:"sme_id"`
	BusinessName    string             `json:"business_name"`
	OwnerName       string             `json:"owner_name"`
	RiskLevel       string             `json:"risk_level"` // "LOW" | "HIGH"
	IsFlagged       bool               `json:"is_flagged"`
	FlaggedReason   string             `json:"flagged_reason,omitempty"`
	MatchedIllegals []IllegalEntityDTO `json:"matched_illegals"`
	ScannedAt       time.Time          `json:"scanned_at"`
}

type SyncResultDTO struct {
	Success        bool   `json:"success"`
	FallbackUsed   bool   `json:"fallback_used"`
	Message        string `json:"message"`
	LicensedSynced int    `json:"licensed_synced"`
	IllegalSynced  int    `json:"illegal_synced"`
}

