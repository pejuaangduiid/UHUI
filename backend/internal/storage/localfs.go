package storage

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type LocalFSStorage struct {
	baseDir string
	baseURL string
	secret  []byte
}

func NewLocalFS(baseDir string, secret []byte, baseURL string) (*LocalFSStorage, error) {
	if err := os.MkdirAll(baseDir, 0750); err != nil {
		return nil, fmt.Errorf("create base storage dir: %w", err)
	}
	return &LocalFSStorage{
		baseDir: baseDir,
		secret:  secret,
		baseURL: strings.TrimRight(baseURL, "/"),
	}, nil
}

func (l *LocalFSStorage) pathForKey(key string) string {
	cleanKey := filepath.Clean(key)
	return filepath.Join(l.baseDir, cleanKey)
}

func (l *LocalFSStorage) Put(_ context.Context, key string, data io.Reader, _ int64, _ string) error {
	destPath := l.pathForKey(key)
	if err := os.MkdirAll(filepath.Dir(destPath), 0750); err != nil {
		return fmt.Errorf("mkdir: %w", err)
	}

	f, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	defer func() { _ = f.Close() }()

	_, err = io.Copy(f, data)
	return err
}

func (l *LocalFSStorage) Get(_ context.Context, key string) (io.ReadCloser, string, error) {
	srcPath := l.pathForKey(key)
	f, err := os.Open(srcPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, "", ErrObjectNotFound
		}
		return nil, "", err
	}
	ctype := mime.TypeByExtension(filepath.Ext(srcPath))
	if ctype == "" {
		ctype = "application/octet-stream"
	}
	return f, ctype, nil
}

func (l *LocalFSStorage) Move(_ context.Context, srcKey, destKey string) error {
	src := l.pathForKey(srcKey)
	dest := l.pathForKey(destKey)
	if err := os.MkdirAll(filepath.Dir(dest), 0750); err != nil {
		return err
	}
	if err := os.Rename(src, dest); err != nil {
		if os.IsNotExist(err) {
			return ErrObjectNotFound
		}
		return err
	}
	return nil
}

func (l *LocalFSStorage) Delete(_ context.Context, key string) error {
	path := l.pathForKey(key)
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (l *LocalFSStorage) SignedURL(_ context.Context, key string, ttl time.Duration) (string, error) {
	if ttl <= 0 || ttl > 5*time.Minute {
		return "", ErrInvalidTTL
	}
	expires := time.Now().Add(ttl).Unix()
	sig := l.computeSig(key, expires)
	return fmt.Sprintf("%s/api/v1/storage/dev/%s?expires=%d&sig=%s", l.baseURL, key, expires, sig), nil
}

func (l *LocalFSStorage) computeSig(key string, expires int64) string {
	mac := hmac.New(sha256.New, l.secret)
	_, _ = fmt.Fprintf(mac, "%s:%d", key, expires)
	return hex.EncodeToString(mac.Sum(nil))
}

func (l *LocalFSStorage) ValidateSig(key string, expires int64, sig string) bool {
	if time.Now().Unix() > expires {
		return false
	}
	expected := l.computeSig(key, expires)
	return hmac.Equal([]byte(expected), []byte(sig))
}

func (l *LocalFSStorage) ListExpired(_ context.Context, prefix string, olderThan time.Duration) ([]string, error) {
	var expired []string
	searchDir := l.pathForKey(prefix)
	threshold := time.Now().Add(-olderThan)

	err := filepath.Walk(searchDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			if os.IsNotExist(err) {
				return nil
			}
			return err
		}
		if !info.IsDir() && info.ModTime().Before(threshold) {
			rel, _ := filepath.Rel(l.baseDir, path)
			expired = append(expired, filepath.ToSlash(rel))
		}
		return nil
	})
	return expired, err
}
