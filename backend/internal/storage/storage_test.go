package storage_test

import (
	"bytes"
	"context"
	"errors"
	"io"
	"path/filepath"
	"testing"
	"time"

	"github.com/uhui/backend/internal/storage"
)

func TestR8_4_SignedURLExpires(t *testing.T) {
	tmpDir := t.TempDir()
	secret := []byte("test-secret-key-12345")
	fs, err := storage.NewLocalFS(tmpDir, secret, "http://localhost:8080")
	if err != nil {
		t.Fatalf("NewLocalFS failed: %v", err)
	}

	ctx := context.Background()

	_, err = fs.SignedURL(ctx, "proofs/test.jpg", 6*time.Minute)
	if !errors.Is(err, storage.ErrInvalidTTL) {
		t.Fatalf("expected ErrInvalidTTL for 6 min TTL, got: %v", err)
	}

	_, err = fs.SignedURL(ctx, "proofs/test.jpg", 0)
	if !errors.Is(err, storage.ErrInvalidTTL) {
		t.Fatalf("expected ErrInvalidTTL for 0 TTL, got: %v", err)
	}

	urlStr, err := fs.SignedURL(ctx, "proofs/test.jpg", 5*time.Minute)
	if err != nil {
		t.Fatalf("expected valid signed URL, got error: %v", err)
	}
	if urlStr == "" {
		t.Fatal("expected non-empty URL")
	}
}

func TestLocalFS_CrudAndMove(t *testing.T) {
	tmpDir := t.TempDir()
	fs, _ := storage.NewLocalFS(tmpDir, []byte("sec"), "http://localhost:8080")
	ctx := context.Background()

	key := filepath.ToSlash("pending/sme1/doc.png")
	data := []byte("sample image content")

	err := fs.Put(ctx, key, bytes.NewReader(data), int64(len(data)), "image/png")
	if err != nil {
		t.Fatalf("Put failed: %v", err)
	}

	rc, _, err := fs.Get(ctx, key)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	readBytes, _ := io.ReadAll(rc)
	_ = rc.Close()
	if !bytes.Equal(readBytes, data) {
		t.Fatalf("content mismatch")
	}

	destKey := filepath.ToSlash("proofs/sme1/doc.png")
	err = fs.Move(ctx, key, destKey)
	if err != nil {
		t.Fatalf("Move failed: %v", err)
	}

	_, _, err = fs.Get(ctx, key)
	if !errors.Is(err, storage.ErrObjectNotFound) {
		t.Fatalf("expected old key to be not found, got %v", err)
	}

	rc, _, err = fs.Get(ctx, destKey)
	if err != nil {
		t.Fatalf("Get destKey failed: %v", err)
	}
	_ = rc.Close()

	_ = fs.Delete(ctx, destKey)
	_, _, err = fs.Get(ctx, destKey)
	if !errors.Is(err, storage.ErrObjectNotFound) {
		t.Fatalf("expected deleted key to be not found")
	}
}
