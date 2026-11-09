package metrics

import (
	"time"

	"github.com/uhui/backend/internal/money"
)

const (
	GateNibBelumTerverifikasi       = "NIB_BELUM_TERVERIFIKASI"
	GatePtTidakSesuai               = "PT_TIDAK_SESUAI"
	GateDokumenPtBelumTerverifikasi = "DOKUMEN_PT_BELUM_TERVERIFIKASI"
	GateDataBelumCukup              = "DATA_BELUM_CUKUP"
	GateRiwayatKurang               = "RIWAYAT_KURANG"
	GateSkorDiBawahAmbang           = "SKOR_DI_BAWAH_AMBANG"
)

func ComputeComponentA(activeDays int) int {
	score, _ := money.FloorDiv(int64(activeDays*100), 30)
	return int(money.Clamp(score, 0, 100))
}

func ComputeComponentB(restockCount int, verifiedIDR, totalIDR int64, minRestock int) *int {
	if restockCount < minRestock || totalIDR <= 0 {
		return nil
	}
	score, _ := money.FloorDiv(verifiedIDR*100, totalIDR)
	v := int(money.Clamp(score, 0, 100))
	return &v
}

func ComputeComponentC(netCashFlowIDR, revenueIDR int64) int {
	if revenueIDR <= 0 || netCashFlowIDR <= 0 {
		return 0
	}
	marginBps, err := money.MulDivFloor(netCashFlowIDR, 10000, revenueIDR)
	if err != nil {
		return 0
	}
	score, _ := money.FloorDiv(marginBps, 20)
	return int(money.Clamp(score, 0, 100))
}

func ComputeComponentD(scheme string, docs map[string]bool, profileComplete bool, dItems map[string]ItemWeights) int {
	weights, ok := dItems[scheme]
	if !ok {
		weights = ItemWeights{Profile: 20, NIB: 35, NPWP: 25, BankAccount: 20}
	}

	var score int
	if profileComplete {
		score += weights.Profile
	}
	if docs["nib"] {
		score += weights.NIB
	}
	if docs["npwp"] {
		score += weights.NPWP
	}
	if docs["business_bank_account"] {
		score += weights.BankAccount
	}
	if scheme == "micro_equity" && docs["pt_deed"] {
		score += weights.PTDeed
	}
	return int(money.Clamp(int64(score), 0, 100))
}

func ComputeTotal(a int, b *int, c int, d int, w Weights) *int {
	if b == nil {
		return nil
	}
	weightedSum := int64(a*w.WeightA + (*b)*w.WeightB + c*w.WeightC + d*w.WeightD)
	total, _ := money.FloorDiv(weightedSum, 100)
	v := int(money.Clamp(total, 0, 100))
	return &v
}

func EvaluateGates(scheme string, isPT bool, docs map[string]bool, b *int, firstTxDate *time.Time, now time.Time, minDays int, total *int, minScore int) []string {
	var failures []string
	if !docs["nib"] {
		failures = append(failures, GateNibBelumTerverifikasi)
	}
	if scheme == "micro_equity" && !isPT {
		failures = append(failures, GatePtTidakSesuai)
	}
	if scheme == "micro_equity" && !docs["pt_deed"] {
		failures = append(failures, GateDokumenPtBelumTerverifikasi)
	}
	if b == nil {
		failures = append(failures, GateDataBelumCukup)
	}
	if firstTxDate == nil || now.Sub(*firstTxDate) < time.Duration(minDays)*24*time.Hour {
		failures = append(failures, GateRiwayatKurang)
	}
	if total == nil || *total < minScore {
		failures = append(failures, GateSkorDiBawahAmbang)
	}
	return failures
}
