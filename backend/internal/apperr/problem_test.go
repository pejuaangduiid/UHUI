package apperr_test

import (
	"net/http"
	"testing"

	"github.com/uhui/backend/internal/apperr"
)

func TestProblemDetails(t *testing.T) {
	err := apperr.NotFound(apperr.CodeUserNotFound, "User tidak ditemukan", "Periksa kembali ID pengguna")
	pd := apperr.NewProblemDetails(err)

	if pd.Status != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, pd.Status)
	}
	if pd.Code != apperr.CodeUserNotFound {
		t.Errorf("expected code %s, got %s", apperr.CodeUserNotFound, pd.Code)
	}
	if pd.Hint != "Periksa kembali ID pengguna" {
		t.Errorf("expected hint, got %s", pd.Hint)
	}

	hErr := apperr.HumaStatusError(err)
	if hErr.GetStatus() != http.StatusNotFound {
		t.Errorf("expected huma status %d, got %d", http.StatusNotFound, hErr.GetStatus())
	}
}
