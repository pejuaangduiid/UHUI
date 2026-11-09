package llm

import (
	"context"
	"errors"
)

var ErrInvalidReceipt = errors.New("fake_llm: invalid receipt image")

type FakeLLM struct {
	ModelName string
}

func NewFakeLLM() *FakeLLM {
	return &FakeLLM{
		ModelName: "fake-gemini-flash",
	}
}

func (f *FakeLLM) Name() string {
	return f.ModelName
}

func (f *FakeLLM) ExtractReceipt(_ context.Context, img []byte, _ string) (*ReceiptProposal, error) {
	if len(img) == 0 {
		return nil, ErrInvalidReceipt
	}

	return &ReceiptProposal{
		MerchantName: "Toko Grosir Berkah",
		Date:         "2026-10-29",
		TotalAmount:  150_000,
		Items: []ProposedItem{
			{
				Description:  "Beras Premium 5kg",
				Qty:          2,
				UnitPriceIDR: 75_000,
				LineTotalIDR: 150_000,
			},
		},
	}, nil
}

func (f *FakeLLM) GenerateInsight(_ context.Context, _ InsightInput) (*InsightOutput, error) {
	return &InsightOutput{
		SummaryText: "Arus kas stabil dengan perputaran barang yang baik.",
		Anomalies:   []string{},
		ActionItems: []string{
			"Tinjau kembali stok barang yang belum terjual dalam 14 hari.",
			"Pastikan bukti nota restock rutin difoto dan diverifikasi.",
			"Pertimbangkan promosi akhir pekan untuk meningkatkan perputaran kas.",
		},
	}, nil
}
