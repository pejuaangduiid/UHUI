package reports

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"
)

var (
	hexRegex         = regexp.MustCompile("^[0-9a-f]{64}$")
	ErrInvalidHex    = errors.New("canonical: hash must be 64 lowercase hex characters")
	ErrFloatDetected = errors.New("canonical: non-integer numbers are strictly forbidden")
)

func Canonicalize(v any) ([]byte, error) {
	if err := validateNoFloats(v); err != nil {
		return nil, err
	}
	bytes, err := json.Marshal(v)
	if err != nil {
		return nil, fmt.Errorf("canonicalize: %w", err)
	}
	return bytes, nil
}

func validateNoFloats(v any) error {
	if v == nil {
		return nil
	}
	k := reflect.TypeOf(v).Kind().String()
	if strings.HasPrefix(k, "fl") {
		return ErrFloatDetected
	}

	switch val := v.(type) {
	case map[string]any:
		for _, sub := range val {
			if err := validateNoFloats(sub); err != nil {
				return err
			}
		}
	case []any:
		for _, sub := range val {
			if err := validateNoFloats(sub); err != nil {
				return err
			}
		}
	}
	return nil
}

func ComputeHash(canonicalBytes []byte) [32]byte {
	return sha256.Sum256(canonicalBytes)
}

func HexFromHash(h [32]byte) string {
	return hex.EncodeToString(h[:])
}

func HashFromHex(s string) ([32]byte, error) {
	var result [32]byte
	if !hexRegex.MatchString(s) {
		return result, ErrInvalidHex
	}
	bytes, err := hex.DecodeString(s)
	if err != nil || len(bytes) != 32 {
		return result, ErrInvalidHex
	}
	copy(result[:], bytes)
	return result, nil
}
