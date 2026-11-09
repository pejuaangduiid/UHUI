package receipts

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/cache"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/llm"
	"github.com/uhui/backend/internal/storage"
)

type Service struct {
	pool    *pgxpool.Pool
	store   storage.StorageProvider
	llm     llm.LLMClient
	limiter *cache.OCRRateLimiter
}

func NewService(pool *pgxpool.Pool, store storage.StorageProvider, llmClient llm.LLMClient, limiter *cache.OCRRateLimiter) *Service {
	return &Service{
		pool:    pool,
		store:   store,
		llm:     llmClient,
		limiter: limiter,
	}
}

type ScanResult struct {
	ExpiresAt        time.Time          `json:"expires_at"`
	ScanID           string             `json:"scan_id"`
	MerchantName     string             `json:"merchant_name"`
	Date             string             `json:"date"`
	Items            []llm.ProposedItem `json:"items"`
	TotalAmountIDR   int64              `json:"total_amount_idr"`
	DuplicateSuspect bool               `json:"duplicate_suspect"`
}

func (s *Service) ScanReceipt(ctx context.Context, smeID, userID pgtype.UUID, imgBytes []byte, filename string) (*ScanResult, error) {
	if allowed, _, err := s.limiter.Allow(ctx, uuidToString(userID)); !allowed || err != nil {
		return nil, apperr.TooManyRequests(apperr.CodeRateLimitExceeded, "Batas pindai nota tercapai (maks 10 per jam)", "Tunggu beberapa saat sebelum mencoba kembali")
	}

	mimeType, err := detectImageMagicBytes(imgBytes)
	if err != nil {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, err.Error(), "Format file harus JPEG, PNG, atau WebP")
	}

	hash := sha256.Sum256(imgBytes)
	queries := gen.New(s.pool)
	isDuplicateTx, err := queries.CheckDuplicateProofHash(ctx, gen.CheckDuplicateProofHashParams{
		SmeID:       smeID,
		ProofSha256: hash[:],
	})
	if err != nil {
		return nil, err
	}
	isDuplicateScan, err := queries.CheckDuplicateReceiptScanHash(ctx, gen.CheckDuplicateReceiptScanHashParams{
		SmeID:  smeID,
		Sha256: hash[:],
	})
	if err != nil {
		return nil, err
	}
	if isDuplicateTx || isDuplicateScan {
		return nil, apperr.Conflict(apperr.CodeDuplicateProof, "Bukti nota ini sudah pernah digunakan sebelumnya (R1.3)", "Gunakan foto nota fisik transaksi yang baru")
	}

	proposal, err := s.llm.ExtractReceipt(ctx, imgBytes, mimeType)
	if err != nil {
		return nil, fmt.Errorf("ocr extraction: %w", err)
	}
	if err := llm.ValidateReceiptProposal(proposal); err != nil {
		return nil, apperr.Unprocessable(apperr.CodeBadRequest, "Format hasil OCR nota tidak valid", err.Error())
	}

	return s.saveScanProposal(ctx, queries, smeID, userID, imgBytes, hash[:], proposal)
}

func (s *Service) saveScanProposal(ctx context.Context, q *gen.Queries, smeID, userID pgtype.UUID, imgBytes, hash []byte, p *llm.ReceiptProposal) (*ScanResult, error) {
	storageKey := fmt.Sprintf("pending/%s/%x.webp", uuidToString(smeID), hash[:8])
	if err := s.store.Put(ctx, storageKey, bytes.NewReader(imgBytes), int64(len(imgBytes)), "image/webp"); err != nil {
		return nil, fmt.Errorf("upload pending proof: %w", err)
	}

	proposalJSON, _ := json.Marshal(p)
	expiresAt := time.Now().Add(24 * time.Hour)

	var txDate time.Time
	if t, err := time.Parse("2006-01-02", strings.TrimSpace(p.Date)); err == nil {
		txDate = t
	} else {
		txDate = time.Now()
	}

	isSuspect, _ := q.CheckSuspectDuplicate(ctx, gen.CheckSuspectDuplicateParams{
		SmeID:          smeID,
		TotalAmountIdr: p.TotalAmount,
		TxDate:         pgtype.Timestamptz{Time: txDate, Valid: true},
	})

	scanRow, err := q.CreateReceiptScan(ctx, gen.CreateReceiptScanParams{
		SmeID:        smeID,
		UserID:       userID,
		ObjectKey:    storageKey,
		Sha256:       hash,
		ProposalJson: proposalJSON,
		OcrTotalIdr:  p.TotalAmount,
		ExpiresAt:    pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})
	if err != nil {
		_ = s.store.Delete(ctx, storageKey)
		return nil, fmt.Errorf("create scan record: %w", err)
	}

	return &ScanResult{
		ScanID:           uuidToString(scanRow.ID),
		MerchantName:     p.MerchantName,
		Date:             p.Date,
		TotalAmountIDR:   p.TotalAmount,
		Items:            p.Items,
		DuplicateSuspect: isSuspect,
		ExpiresAt:        expiresAt,
	}, nil
}

func detectImageMagicBytes(b []byte) (string, error) {
	if len(b) < 12 {
		return "", fmt.Errorf("file terlalu kecil")
	}
	if b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF {
		return "image/jpeg", nil
	}
	if b[0] == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G' {
		return "image/png", nil
	}
	if string(b[0:4]) == "RIFF" && string(b[8:12]) == "WEBP" {
		return "image/webp", nil
	}
	return "", fmt.Errorf("tipe berkas tidak didukung (hanya JPEG, PNG, WebP)")
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	src := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", src[0:4], src[4:6], src[6:8], src[8:10], src[10:16])
}
