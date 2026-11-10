package bursa

import (
	"time"
)

type PublicCampaignDTO struct {
	ID                   string    `json:"id,omitempty"`
	ClosesAt             time.Time `json:"closes_at"`
	BusinessName         string    `json:"business_name"`
	Sector               string    `json:"sector"`
	Slug                 string    `json:"slug"`
	Title                string    `json:"title"`
	Scheme               string    `json:"scheme"`
	Status               string    `json:"status"`
	TargetAmountIDR      int64     `json:"target_amount_idr"`
	RaisedAmountIDR      int64     `json:"raised_amount_idr"`
	MinInvestmentIDR     int64     `json:"min_investment_idr"`
	LatestReadinessScore int16     `json:"latest_readiness_score"`
	ReturnShareBps       int16     `json:"return_share_bps"`
	TermMonths           int16     `json:"term_months"`
	IsIncorporatedPT     bool      `json:"is_incorporated_pt"`
	SCFPartnerID         *string   `json:"scf_partner_id,omitempty"`
	SCFPartnerName       *string   `json:"scf_partner_name,omitempty"`
	SCFLicenseNumber     *string   `json:"scf_license_number,omitempty"`
	SCFWebsiteURL        *string   `json:"scf_website_url,omitempty"`
	OJKRegisteredCode    *string   `json:"ojk_registered_code,omitempty"`
}

type PublicCampaignDetailDTO struct {
	Description string `json:"description"`
	PublicCampaignDTO
}

type CampaignDTO struct {
	FundedAt          *time.Time `json:"funded_at,omitempty"`
	ReviewNote        *string    `json:"review_note,omitempty"`
	ReviewedBy        *string    `json:"reviewed_by,omitempty"`
	ReadinessScoreID  *string    `json:"readiness_score_id,omitempty"`
	SCFPartnerID      *string    `json:"scf_partner_id,omitempty"`
	OJKRegisteredCode *string    `json:"ojk_registered_code,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	ClosesAt          time.Time  `json:"closes_at"`
	ID                string     `json:"id"`
	SMEID             string     `json:"sme_id"`
	Slug              string     `json:"slug"`
	Title             string     `json:"title"`
	Scheme            string     `json:"scheme"`
	Status            string     `json:"status"`
	TargetAmountIDR   int64      `json:"target_amount_idr"`
	RaisedAmountIDR   int64      `json:"raised_amount_idr"`
	MinInvestmentIDR  int64      `json:"min_investment_idr"`
	ReturnShareBps    int16      `json:"return_share_bps"`
	TermMonths        int16      `json:"term_months"`
}

type InvestmentDTO struct {
	CreatedAt      time.Time `json:"created_at"`
	ID             string    `json:"id"`
	CampaignID     string    `json:"campaign_id"`
	InvestorID     string    `json:"investor_id"`
	Status         string    `json:"status"`
	IdempotencyKey string    `json:"idempotency_key"`
	RequestHash    string    `json:"request_hash"`
	PaymentRef     string    `json:"payment_ref"`
	AmountIDR      int64     `json:"amount_idr"`
}

type PortfolioItemDTO struct {
	CreatedAt      time.Time `json:"created_at"`
	ID             string    `json:"id"`
	CampaignID     string    `json:"campaign_id"`
	CampaignTitle  string    `json:"campaign_title"`
	CampaignSlug   string    `json:"campaign_slug"`
	CampaignStatus string    `json:"campaign_status"`
	Scheme         string    `json:"scheme"`
	SMEID          string    `json:"sme_id"`
	BusinessName   string    `json:"business_name"`
	Sector         string    `json:"sector"`
	PaymentRef     string    `json:"payment_ref"`
	Status         string    `json:"status"`
	AmountIDR      int64     `json:"amount_idr"`
	ReturnShareBps int16     `json:"return_share_bps"`
	TermMonths     int16     `json:"term_months"`
}

type ProfitDistributionDTO struct {
	PeriodStart      time.Time             `json:"period_start"`
	PeriodEnd        time.Time             `json:"period_end"`
	CreatedAt        time.Time             `json:"created_at"`
	ReportSnapshotID *string               `json:"report_snapshot_id,omitempty"`
	ID               string                `json:"id"`
	CampaignID       string                `json:"campaign_id"`
	Items            []DistributionItemDTO `json:"items,omitempty"`
	PoolIDR          int64                 `json:"pool_idr"`
}

type DistributionItemDTO struct {
	DistributionID string `json:"distribution_id"`
	InvestmentID   string `json:"investment_id"`
	InvestorID     string `json:"investor_id"`
	InvestorName   string `json:"investor_name"`
	AmountIDR      int64  `json:"amount_idr"`
}
