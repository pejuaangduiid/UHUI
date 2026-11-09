package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type SupabaseStorage struct {
	client     *http.Client
	baseURL    string
	serviceKey string
	bucket     string
}

func NewSupabaseStorage(supabaseURL, serviceKey, bucket string) *SupabaseStorage {
	return &SupabaseStorage{
		client:     &http.Client{Timeout: 30 * time.Second},
		baseURL:    strings.TrimRight(supabaseURL, "/"),
		serviceKey: serviceKey,
		bucket:     bucket,
	}
}

func (s *SupabaseStorage) Put(ctx context.Context, key string, data io.Reader, size int64, contentType string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, s.bucket, key)
	bodyBytes, err := io.ReadAll(data)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	s.setAuthHeaders(req, contentType)

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase storage put: %s (status %d)", string(respBody), resp.StatusCode)
	}
	return nil
}

func (s *SupabaseStorage) Get(ctx context.Context, key string) (io.ReadCloser, string, error) {
	url := fmt.Sprintf("%s/storage/v1/object/authenticated/%s/%s", s.baseURL, s.bucket, key)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, "", err
	}
	s.setAuthHeaders(req, "")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, "", err
	}
	if resp.StatusCode == http.StatusNotFound {
		_ = resp.Body.Close()
		return nil, "", ErrObjectNotFound
	}
	if resp.StatusCode != http.StatusOK {
		_ = resp.Body.Close()
		return nil, "", fmt.Errorf("supabase storage get error: %d", resp.StatusCode)
	}
	return resp.Body, resp.Header.Get("Content-Type"), nil
}

func (s *SupabaseStorage) Move(ctx context.Context, srcKey, destKey string) error {
	url := fmt.Sprintf("%s/storage/v1/object/move", s.baseURL)
	payload := fmt.Sprintf(`{"bucketId":"%s","sourceKey":"%s","destinationKey":"%s"}`, s.bucket, srcKey, destKey)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(payload))
	if err != nil {
		return err
	}
	s.setAuthHeaders(req, "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("move object failed: status %d", resp.StatusCode)
	}
	return nil
}

func (s *SupabaseStorage) Delete(ctx context.Context, key string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, s.bucket, key)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return err
	}
	s.setAuthHeaders(req, "")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer func() { _ = resp.Body.Close() }()
	return nil
}

func (s *SupabaseStorage) SignedURL(ctx context.Context, key string, ttl time.Duration) (string, error) {
	if ttl <= 0 || ttl > 5*time.Minute {
		return "", ErrInvalidTTL
	}
	url := fmt.Sprintf("%s/storage/v1/object/sign/%s/%s", s.baseURL, s.bucket, key)
	payload := fmt.Sprintf(`{"expiresIn":%d}`, int(ttl.Seconds()))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(payload))
	if err != nil {
		return "", err
	}
	s.setAuthHeaders(req, "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("sign url failed: %d", resp.StatusCode)
	}
	return fmt.Sprintf("%s/storage/v1/object/authenticated/%s/%s", s.baseURL, s.bucket, key), nil
}

func (s *SupabaseStorage) ListExpired(_ context.Context, _ string, _ time.Duration) ([]string, error) {
	return nil, nil
}

func (s *SupabaseStorage) setAuthHeaders(req *http.Request, contentType string) {
	req.Header.Set("Authorization", "Bearer "+s.serviceKey)
	req.Header.Set("apikey", s.serviceKey)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
}
