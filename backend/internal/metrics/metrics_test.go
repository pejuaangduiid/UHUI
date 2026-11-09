package metrics_test

import (
	"testing"
	"time"

	"github.com/uhui/backend/internal/metrics"
)

type fixedClock struct {
	t time.Time
}

func (f fixedClock) Now() time.Time {
	return f.t
}

func TestR2_5_Window30Inclusive(t *testing.T) {

	date := time.Date(2026, 10, 30, 15, 0, 0, 0, metrics.WIB)
	today := metrics.Today(fixedClock{t: date})

	start, end := metrics.Window30(today)

	expectedStart := time.Date(2026, 10, 1, 0, 0, 0, 0, metrics.WIB)
	if !start.Equal(expectedStart) {
		t.Errorf("Window30 start = %v, want %v", start, expectedStart)
	}
	if end.Day() != 30 || end.Month() != 10 {
		t.Errorf("Window30 end date mismatch: %v", end)
	}
}

func TestR2_1_ComponentB_RestockThreshold(t *testing.T) {

	res := metrics.ComputeComponentB(4, 1_000_000, 1_000_000, 5)
	if res != nil {
		t.Errorf("expected nil for restockCount=4, got %v", *res)
	}

	res = metrics.ComputeComponentB(5, 0, 0, 5)
	if res != nil {
		t.Errorf("expected nil for totalIDR=0, got %v", *res)
	}

	res = metrics.ComputeComponentB(5, 500_000, 1_000_000, 5)
	if res == nil || *res != 50 {
		t.Fatalf("expected 50, got %v", res)
	}

	res = metrics.ComputeComponentB(7, 2_000_000, 2_000_000, 5)
	if res == nil || *res != 100 {
		t.Fatalf("expected 100, got %v", res)
	}
}

func TestR2_1_ComponentC_MarginClamping(t *testing.T) {

	score := metrics.ComputeComponentC(200_000, 1_000_000)
	if score != 100 {
		t.Errorf("expected 100 for 20%% margin, got %d", score)
	}

	score = metrics.ComputeComponentC(100_000, 1_000_000)
	if score != 50 {
		t.Errorf("expected 50 for 10%% margin, got %d", score)
	}

	score = metrics.ComputeComponentC(-50_000, 1_000_000)
	if score != 0 {
		t.Errorf("expected 0 for loss, got %d", score)
	}

	score = metrics.ComputeComponentC(0, 0)
	if score != 0 {
		t.Errorf("expected 0 for 0 revenue, got %d", score)
	}
}

func TestR2_4_GatesEvaluation(t *testing.T) {
	now := time.Now()
	firstTx := now.Add(-31 * 24 * time.Hour)
	totalScore := 80
	validB := 70

	docsPass := map[string]bool{
		"nib":                   true,
		"npwp":                  true,
		"business_bank_account": true,
		"pt_deed":               true,
	}

	failures := metrics.EvaluateGates("micro_equity", true, docsPass, &validB, &firstTx, now, 30, &totalScore, 75)
	if len(failures) != 0 {
		t.Errorf("expected 0 failures, got %v", failures)
	}

	docsFail := map[string]bool{}
	recentTx := now.Add(-10 * 24 * time.Hour)
	lowScore := 60
	failures = metrics.EvaluateGates("micro_equity", false, docsFail, nil, &recentTx, now, 30, &lowScore, 75)

	expectedFailures := []string{
		metrics.GateNibBelumTerverifikasi,
		metrics.GatePtTidakSesuai,
		metrics.GateDokumenPtBelumTerverifikasi,
		metrics.GateDataBelumCukup,
		metrics.GateRiwayatKurang,
		metrics.GateSkorDiBawahAmbang,
	}
	if len(failures) != len(expectedFailures) {
		t.Fatalf("expected %d failures, got %d (%v)", len(expectedFailures), len(failures), failures)
	}
}
