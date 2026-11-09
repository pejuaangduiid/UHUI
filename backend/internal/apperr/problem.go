package apperr

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
)

const (
	CodeInvalidCredentials = "INVALID_CREDENTIALS"
	CodeTokenExpired       = "TOKEN_EXPIRED"
	CodeTokenReused        = "TOKEN_REUSED"
	CodeUnauthorized       = "UNAUTHORIZED"
	CodeForbiddenRole      = "FORBIDDEN_ROLE"
	CodePdpConsentRequired = "PDP_CONSENT_REQUIRED"
	CodeInvalidRole        = "INVALID_ROLE"
	CodeEmailAlreadyExists = "EMAIL_ALREADY_EXISTS"
	CodeUserNotFound       = "USER_NOT_FOUND"

	CodeForbiddenTenant    = "FORBIDDEN_TENANT"
	CodeNotSMEOwner        = "NOT_SME_OWNER"
	CodeNotBoardroomMember = "NOT_BOARDROOM_MEMBER"
	CodeCSRFMissingOrigin  = "CSRF_MISSING_ORIGIN"
	CodeCSRFOriginMismatch = "CSRF_ORIGIN_MISMATCH"

	CodeRateLimitExceeded = "RATE_LIMIT_EXCEEDED"

	CodeInsufficientStock     = "INSUFFICIENT_STOCK"
	CodeDuplicateProof        = "DUPLICATE_PROOF"
	CodeDuplicateSuspect      = "DUPLICATE_SUSPECT"
	CodeReceiptExpired        = "RECEIPT_EXPIRED"
	CodeInvalidTxDate         = "INVALID_TX_DATE"
	CodeTxAlreadyReversed     = "TX_ALREADY_REVERSED"
	CodeCannotReverseReversal = "CANNOT_REVERSE_REVERSAL"

	CodeNibBelumTerverifikasi       = "NIB_BELUM_TERVERIFIKASI"
	CodePtTidakSesuai               = "PT_TIDAK_SESUAI"
	CodeDokumenPtBelumTerverifikasi = "DOKUMEN_PT_BELUM_TERVERIFIKASI"
	CodeDataBelumCukup              = "DATA_BELUM_CUKUP"
	CodeRiwayatKurang               = "RIWAYAT_KURANG"
	CodeSkorDiBawahAmbang           = "SKOR_DI_BAWAH_AMBANG"

	CodeIdempotencyConflict    = "IDEMPOTENCY_CONFLICT"
	CodeCampaignNotOpen        = "CAMPAIGN_NOT_OPEN"
	CodeCampaignTargetExceeded = "CAMPAIGN_TARGET_EXCEEDED"
	CodeCampaignClosed         = "CAMPAIGN_CLOSED"
	CodeMinInvestmentNotMet    = "MIN_INVESTMENT_NOT_MET"
	CodeOwnerCannotInvest      = "OWNER_CANNOT_INVEST"
	CodeActiveCampaignExists   = "ACTIVE_CAMPAIGN_EXISTS"

	CodeBadRequest    = "BAD_REQUEST"
	CodeNotFound      = "NOT_FOUND"
	CodeInternalError = "INTERNAL_ERROR"
)

type ProblemDetails struct {
	Type     string `json:"type,omitempty" doc:"URI reference identifying the problem type"`
	Title    string `json:"title" doc:"Short human-readable summary of problem"`
	Detail   string `json:"detail" doc:"Human-readable explanation specific to this occurrence"`
	Code     string `json:"code" doc:"Application-specific error code"`
	Hint     string `json:"hint,omitempty" doc:"Optional actionable suggestion"`
	Instance string `json:"instance,omitempty" doc:"URI reference identifying this occurrence"`
	Status   int    `json:"status" doc:"HTTP status code"`
}

func NewProblemDetails(err *Error) ProblemDetails {
	if err == nil {
		return ProblemDetails{
			Type:   "about:blank",
			Title:  http.StatusText(http.StatusInternalServerError),
			Status: http.StatusInternalServerError,
			Detail: "An unexpected error occurred",
			Code:   CodeInternalError,
		}
	}
	return ProblemDetails{
		Type:   "about:blank",
		Title:  http.StatusText(err.HTTPStatus),
		Status: err.HTTPStatus,
		Detail: err.Message,
		Code:   err.Code,
		Hint:   err.Hint,
	}
}

func HumaStatusError(err *Error) huma.StatusError {
	if err == nil {
		return huma.NewError(http.StatusInternalServerError, "Internal Server Error")
	}
	detail := err.Message
	if err.Hint != "" {
		detail += " (Hint: " + err.Hint + ")"
	}
	return huma.NewError(err.HTTPStatus, detail, &huma.ErrorDetail{
		Message:  err.Message,
		Location: err.Code,
	})
}
