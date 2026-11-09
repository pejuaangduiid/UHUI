package auth_test

import (
	"testing"

	"github.com/uhui/backend/internal/modules/auth"
)

func TestR8_1_Argon2id_Hashing(t *testing.T) {
	password := "SecretP@ssw0rd123"

	hash, err := auth.HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword error: %v", err)
	}

	if hash == "" {
		t.Fatal("expected non-empty hash")
	}

	match, err := auth.ComparePassword(password, hash)
	if err != nil {
		t.Fatalf("ComparePassword error: %v", err)
	}
	if !match {
		t.Errorf("expected password to match hash")
	}

	wrongMatch, err := auth.ComparePassword("WrongPassword123", hash)
	if err != nil {
		t.Fatalf("ComparePassword error: %v", err)
	}
	if wrongMatch {
		t.Errorf("expected wrong password not to match")
	}
}
