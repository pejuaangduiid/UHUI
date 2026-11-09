package aicopilot

import (
	"encoding/json"
	"fmt"
)

type PromptData struct {
	Candidates  []CandidateAnomaly `json:"candidates"`
	SalesIDR    int64              `json:"sales_idr"`
	ExpensesIDR int64              `json:"expenses_idr"`
	NetCashIDR  int64              `json:"net_cash_idr"`
	HealthScore int                `json:"health_score"`
	PeriodDays  int16              `json:"period_days"`
}

func BuildPrompt(data PromptData) (string, error) {
	dataBytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return "", fmt.Errorf("marshal prompt data: %w", err)
	}

	instruction := `Anda adalah AI Co-Pilot bisnis UMKM.
Tugas Anda:
1. Tulis ringkasan eksekutif (summary_text) mengenai kondisi keuangan dan operasional bisnis pada periode ini.
2. Tinjau kandidat anomali pada BLOK DATA. Pilih ID yang relevan dan masukkan ke dalam array "anomalies". JANGAN PERNAH membuat ID anomali di luar daftar kandidat yang diberikan.
3. Berikan TEPAT 3 (tiga) rekomendasi aksi taktis dalam array "action_items" (masing-masing maksimal 200 karakter).

Format keluaran WAJIB JSON murni tanpa markdown:
{
  "summary_text": "...",
  "anomalies": ["id_kandidat_1"],
  "action_items": ["aksi 1", "aksi 2", "aksi 3"]
}`

	return fmt.Sprintf("%s\n\n--- BLOK DATA BISNIS ---\n%s", instruction, string(dataBytes)), nil
}
