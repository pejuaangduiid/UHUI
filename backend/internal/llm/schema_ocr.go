package llm

import (
	"errors"
	"fmt"
	"strings"
)

var (
	ErrEmptyMerchant = errors.New("ocr: merchant name is required")
	ErrEmptyDate     = errors.New("ocr: receipt date is required")
	ErrInvalidTotal  = errors.New("ocr: receipt total must be greater than zero")
	ErrNoItems       = errors.New("ocr: receipt must contain at least one item")
	ErrItemMismatch  = errors.New("ocr: item line total does not equal qty * unit price")
	ErrTotalMismatch = errors.New("ocr: sum of line totals does not match receipt total")
)

func ValidateReceiptProposal(p *ReceiptProposal) error {
	if p == nil {
		return errors.New("ocr: proposal is nil")
	}
	if strings.TrimSpace(p.MerchantName) == "" {
		return ErrEmptyMerchant
	}
	if strings.TrimSpace(p.Date) == "" {
		return ErrEmptyDate
	}
	if p.TotalAmount <= 0 {
		return ErrInvalidTotal
	}
	if len(p.Items) == 0 {
		return ErrNoItems
	}

	var sum int64
	for i, item := range p.Items {
		if item.Qty <= 0 || item.UnitPriceIDR <= 0 {
			return fmt.Errorf("ocr item %d: qty and unit price must be positive", i)
		}
		expectedLine := int64(item.Qty) * item.UnitPriceIDR
		if item.LineTotalIDR != expectedLine {
			return fmt.Errorf("ocr item %d: line total %d != qty %d * unit price %d", i, item.LineTotalIDR, item.Qty, item.UnitPriceIDR)
		}
		sum += item.LineTotalIDR
	}

	if sum != p.TotalAmount {
		return fmt.Errorf("%w: items sum %d != total %d", ErrTotalMismatch, sum, p.TotalAmount)
	}

	return nil
}
