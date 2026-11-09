package money

import (
	"errors"
	"math"
	"math/bits"
)

var (
	ErrDivisionByZero = errors.New("money: division by zero")

	ErrOverflow = errors.New("money: integer overflow")
)

func FloorDiv(a, b int64) (int64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	d := a / b
	r := a % b
	if (r > 0 && b < 0) || (r < 0 && b > 0) {
		d--
	}
	return d, nil
}

func Clamp(v, min, max int64) int64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func BpsOf(amount, bps int64) (int64, error) {
	return MulDivFloor(amount, bps, 10000)
}

func MulDivFloor(a, b, c int64) (int64, error) {
	if c == 0 {
		return 0, ErrDivisionByZero
	}
	if a == 0 || b == 0 {
		return 0, nil
	}

	absA, absB, absC, negResult, err := prepMulDiv(a, b, c)
	if err != nil {
		return 0, err
	}

	hi, lo := bits.Mul64(absA, absB)
	if hi >= absC {
		return 0, ErrOverflow
	}

	quot, rem := bits.Div64(hi, lo, absC)
	return applyMulDivSign(quot, rem, negResult)
}

func prepMulDiv(a, b, c int64) (uint64, uint64, uint64, bool, error) {
	negResult := ((a < 0) != (b < 0)) != (c < 0)
	absA, errA := absUint64(a)
	absB, errB := absUint64(b)
	absC, errC := absUint64(c)
	if errA != nil || errB != nil || errC != nil {
		return 0, 0, 0, false, ErrOverflow
	}
	return absA, absB, absC, negResult, nil
}

func applyMulDivSign(quot, rem uint64, negResult bool) (int64, error) {
	if negResult {
		if rem > 0 {
			quot++
		}
		if quot > uint64(math.MaxInt64)+1 {
			return 0, ErrOverflow
		}
		if quot == uint64(math.MaxInt64)+1 {
			return math.MinInt64, nil
		}
		return -int64(quot), nil
	}

	if quot > uint64(math.MaxInt64) {
		return 0, ErrOverflow
	}
	return int64(quot), nil
}

func absUint64(n int64) (uint64, error) {
	if n == math.MinInt64 {
		return uint64(math.MaxInt64) + 1, nil
	}
	if n < 0 {
		return uint64(-n), nil
	}
	return uint64(n), nil
}
