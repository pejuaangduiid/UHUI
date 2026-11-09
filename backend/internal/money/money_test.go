package money_test

import (
	"errors"
	"math"
	"testing"

	"github.com/uhui/backend/internal/money"
)

func TestR2_1_FloorDivNegative(t *testing.T) {
	tests := []struct {
		wantErr error
		name    string
		a       int64
		b       int64
		want    int64
	}{
		{name: "positive exact", a: 6, b: 3, want: 2, wantErr: nil},
		{name: "positive with remainder", a: 7, b: 3, want: 2, wantErr: nil},
		{name: "negative dividend with remainder", a: -7, b: 3, want: -3, wantErr: nil},
		{name: "negative divisor with remainder", a: 7, b: -3, want: -3, wantErr: nil},
		{name: "both negative with remainder", a: -7, b: -3, want: 2, wantErr: nil},
		{name: "negative exact", a: -6, b: 3, want: -2, wantErr: nil},
		{name: "zero dividend", a: 0, b: 5, want: 0, wantErr: nil},
		{name: "division by zero", a: 10, b: 0, want: 0, wantErr: money.ErrDivisionByZero},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := money.FloorDiv(tt.a, tt.b)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("FloorDiv(%d, %d) err = %v, want %v", tt.a, tt.b, err, tt.wantErr)
			}
			if err == nil && got != tt.want {
				t.Errorf("FloorDiv(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.want)
			}
		})
	}
}

func TestClamp(t *testing.T) {
	if got := money.Clamp(50, 0, 100); got != 50 {
		t.Errorf("Clamp(50, 0, 100) = %d, want 50", got)
	}
	if got := money.Clamp(-10, 0, 100); got != 0 {
		t.Errorf("Clamp(-10, 0, 100) = %d, want 0", got)
	}
	if got := money.Clamp(150, 0, 100); got != 100 {
		t.Errorf("Clamp(150, 0, 100) = %d, want 100", got)
	}
}

func TestBpsOf(t *testing.T) {

	got, err := money.BpsOf(1_000_000, 100)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 10_000 {
		t.Errorf("BpsOf(1_000_000, 100) = %d, want 10000", got)
	}
}

func TestMulDivFloor_OverflowDetected(t *testing.T) {
	_, err := money.MulDivFloor(math.MaxInt64, 2, 1)
	if !errors.Is(err, money.ErrOverflow) {
		t.Errorf("expected ErrOverflow, got %v", err)
	}

	res, err := money.MulDivFloor(math.MaxInt64, 2, 4)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var expected int64 = math.MaxInt64 / 2
	if res != expected {
		t.Errorf("expected %d, got %d", expected, res)
	}
}
