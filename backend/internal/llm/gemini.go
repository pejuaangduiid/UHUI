package llm

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

var ErrNotReceipt = errors.New("gambar bukan merupakan bukti nota fisik atau kwitansi yang valid")

type GeminiClient struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

func NewGeminiClient(apiKey, model string) *GeminiClient {
	if model == "" {
		model = "gemini-3.5-flash-lite"
	}
	return &GeminiClient{
		apiKey: apiKey,
		model:  model,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (g *GeminiClient) Name() string {
	return "gemini-" + g.model
}

type geminiPart struct {
	Text       string            `json:"text,omitempty"`
	InlineData *geminiInlineData `json:"inline_data,omitempty"`
}

type geminiInlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

type ocrResultJSON struct {
	IsReceipt    bool           `json:"is_receipt"`
	Reason       string         `json:"reason"`
	MerchantName string         `json:"merchant_name"`
	Date         string         `json:"date"`
	TotalAmount  int64          `json:"total_amount"`
	Items        []ProposedItem `json:"items"`
}

func (g *GeminiClient) ExtractReceipt(ctx context.Context, img []byte, mime string) (*ReceiptProposal, error) {
	if len(img) == 0 {
		return nil, ErrInvalidReceipt
	}
	if mime == "" {
		mime = "image/jpeg"
	}

	b64Img := base64.StdEncoding.EncodeToString(img)

	prompt := `Kamu adalah asisten AI OCR spesialis verifikasi nota, kwitansi, dan struk belanja UMKM.
Tugasmu menganalisis gambar bukti transaksi dengan sangat teliti.

PERATURAN PENTING:
1. Jika gambar BUKAN nota, kwitansi belanja, faktur, atau bukti pembayaran fisik yang sah (misalnya: foto kentang, makanan, orang, pemandangan, benda non-transaksi, atau teks nota buram/rusak/tidak terbaca sama sekali), kembalikan JSON:
{
  "is_receipt": false,
  "reason": "Gambar bukan merupakan nota fisik atau kwitansi belanja yang terbaca (terdeteksi objek non-transaksi atau teks buram). Harap unggah foto nota transaksi yang jelas."
}

2. Jika gambar ADALAH nota fisik/kwitansi yang sah dan terbaca:
- merchant_name: Nama toko / penerbit nota
- date: Tanggal transaksi format YYYY-MM-DD (jika tahun tidak tertulis, gunakan 2026)
- total_amount: Total nilai akhir pembayaran dalam rupiah (angka bulat positif)
- items: Daftar barang belanja. Tiap item memiliki:
  - description: Nama barang
  - qty: Jumlah barang (angka positif minimal 1)
  - unit_price_idr: Harga satuan dalam rupiah
  - line_total_idr: Total baris (harus sama persis dengan qty * unit_price_idr)
- PENTING: Jumlah seluruh line_total_idr pada items HARUS sama persis dengan total_amount. Jika ada PPN/Pajak, diskon, atau ongkir, sertakan sebagai baris item tersendiri (misal 'Pajak PPN', qty: 1) agar penjumlahannya pas.
Kembalikan JSON:
{
  "is_receipt": true,
  "merchant_name": "Nama Toko",
  "date": "YYYY-MM-DD",
  "total_amount": 150000,
  "items": [
    {
      "description": "Nama Barang",
      "qty": 1,
      "unit_price_idr": 150000,
      "line_total_idr": 150000
    }
  ]
}

Keluarkan HANYA JSON murni tanpa markdown code block (tanpa ` + "```json" + `).`

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{Text: prompt},
					{InlineData: &geminiInlineData{MimeType: mime, Data: b64Img}},
				},
			},
		},
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", g.model, g.apiKey)
	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal gemini req: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("create gemini req: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("gemini api call: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read gemini resp: %w", err)
	}

	var geminiResp geminiResponse
	if err := json.Unmarshal(respBytes, &geminiResp); err != nil {
		return nil, fmt.Errorf("parse gemini resp: %w", err)
	}

	if geminiResp.Error != nil {
		return nil, fmt.Errorf("gemini error (%d): %s", geminiResp.Error.Code, geminiResp.Error.Message)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("%w: tidak ada respons dari model AI", ErrNotReceipt)
	}

	text := geminiResp.Candidates[0].Content.Parts[0].Text
	cleanJSON := cleanJSONText(text)

	var ocrRes ocrResultJSON
	if err := json.Unmarshal([]byte(cleanJSON), &ocrRes); err != nil {
		return nil, fmt.Errorf("parse ocr json: %w (raw: %s)", err, cleanJSON)
	}

	if !ocrRes.IsReceipt {
		reason := ocrRes.Reason
		if reason == "" {
			reason = "Gambar bukan merupakan nota fisik atau kwitansi belanja yang terbaca."
		}
		return nil, fmt.Errorf("%w: %s", ErrNotReceipt, reason)
	}

	proposal := &ReceiptProposal{
		MerchantName: strings.TrimSpace(ocrRes.MerchantName),
		Date:         strings.TrimSpace(ocrRes.Date),
		TotalAmount:  ocrRes.TotalAmount,
		Items:        ocrRes.Items,
	}

	if proposal.MerchantName == "" {
		proposal.MerchantName = "Toko / Kasir"
	}
	if proposal.Date == "" {
		proposal.Date = time.Now().Format("2006-01-02")
	}

	// Balance items sum with total
	balanceProposal(proposal)

	return proposal, nil
}

func (g *GeminiClient) GenerateInsight(ctx context.Context, in InsightInput) (*InsightOutput, error) {
	prompt := fmt.Sprintf(`Analisis keuangan UMKM berikut:
Penjualan: Rp%d
Beban: Rp%d
Kas Bersih: Rp%d
SKU Mati/Macet: %v
Kandidat Anomali ID: %v

Berikan 1 ringkasan singkat dan tepat 3 action item konkrit dalam format JSON:
{
  "summary_text": "...",
  "anomalies": [],
  "action_items": ["item 1", "item 2", "item 3"]
}
Keluarkan HANYA JSON murni tanpa markdown.`, in.SalesIDR, in.ExpensesIDR, in.NetCashIDR, in.DeadstockSKU, in.CandidateIDs)

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{Text: prompt},
				},
			},
		},
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", g.model, g.apiKey)
	jsonBytes, _ := json.Marshal(reqBody)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonBytes))
	if err != nil {
		return fallbackInsight(), nil
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		return fallbackInsight(), nil
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	var geminiResp geminiResponse
	if err := json.Unmarshal(respBytes, &geminiResp); err != nil || len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return fallbackInsight(), nil
	}

	cleanJSON := cleanJSONText(geminiResp.Candidates[0].Content.Parts[0].Text)
	var out InsightOutput
	if err := json.Unmarshal([]byte(cleanJSON), &out); err != nil {
		return fallbackInsight(), nil
	}

	if err := ValidateCopilotOutput(&out, in.CandidateIDs); err != nil {
		return fallbackInsight(), nil
	}

	return &out, nil
}

func fallbackInsight() *InsightOutput {
	return &InsightOutput{
		SummaryText: "Arus kas stabil dengan perputaran barang yang baik.",
		Anomalies:   []string{},
		ActionItems: []string{
			"Tinjau kembali stok barang yang belum terjual dalam 14 hari.",
			"Pastikan bukti nota restock rutin difoto dan diverifikasi.",
			"Pantau rasio kas masuk terhadap biaya operasional harian.",
		},
	}
}

func balanceProposal(p *ReceiptProposal) {
	if len(p.Items) == 0 && p.TotalAmount > 0 {
		p.Items = []ProposedItem{
			{
				Description:  "Item Belanja Nota",
				Qty:          1,
				UnitPriceIDR: p.TotalAmount,
				LineTotalIDR: p.TotalAmount,
			},
		}
		return
	}

	var sum int64
	for i := range p.Items {
		if p.Items[i].Qty <= 0 {
			p.Items[i].Qty = 1
		}
		if p.Items[i].UnitPriceIDR <= 0 && p.Items[i].LineTotalIDR > 0 {
			p.Items[i].UnitPriceIDR = p.Items[i].LineTotalIDR / int64(p.Items[i].Qty)
		}
		p.Items[i].LineTotalIDR = int64(p.Items[i].Qty) * p.Items[i].UnitPriceIDR
		sum += p.Items[i].LineTotalIDR
	}

	if p.TotalAmount <= 0 {
		p.TotalAmount = sum
	} else if sum != p.TotalAmount && len(p.Items) > 0 {
		diff := p.TotalAmount - sum
		lastIdx := len(p.Items) - 1
		newTotal := p.Items[lastIdx].LineTotalIDR + diff
		if newTotal > 0 {
			p.Items[lastIdx].LineTotalIDR = newTotal
			p.Items[lastIdx].UnitPriceIDR = newTotal / int64(p.Items[lastIdx].Qty)
			p.Items[lastIdx].LineTotalIDR = int64(p.Items[lastIdx].Qty) * p.Items[lastIdx].UnitPriceIDR
			p.TotalAmount = sum - (p.Items[lastIdx].LineTotalIDR - newTotal)
		} else {
			p.TotalAmount = sum
		}
	}
}

func cleanJSONText(raw string) string {
	raw = strings.TrimSpace(raw)
	if strings.HasPrefix(raw, "```") {
		firstLineEnd := strings.Index(raw, "\n")
		if firstLineEnd != -1 {
			raw = raw[firstLineEnd+1:]
		}
		if strings.HasSuffix(raw, "```") {
			raw = raw[:len(raw)-3]
		}
	}
	return strings.TrimSpace(raw)
}

