package bursa

import (
	"sync"
	"time"
)

type bursaListCacheEntry struct {
	expiresAt time.Time
	items     []PublicCampaignDTO
}

type bursaDetailCacheEntry struct {
	expiresAt time.Time
	detail    *PublicCampaignDetailDTO
}

type publicBursaCache struct {
	listEntries   map[string]bursaListCacheEntry
	detailEntries map[string]bursaDetailCacheEntry
	mu            sync.RWMutex
}

var globalPublicCache = &publicBursaCache{
	listEntries:   make(map[string]bursaListCacheEntry),
	detailEntries: make(map[string]bursaDetailCacheEntry),
}

func (c *publicBursaCache) getList(key string) ([]PublicCampaignDTO, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.listEntries[key]
	if !ok || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return entry.items, true
}

func (c *publicBursaCache) setList(key string, items []PublicCampaignDTO, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.listEntries[key] = bursaListCacheEntry{
		expiresAt: time.Now().Add(ttl),
		items:     items,
	}
}

func (c *publicBursaCache) getDetail(slug string) (*PublicCampaignDetailDTO, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.detailEntries[slug]
	if !ok || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return entry.detail, true
}

func (c *publicBursaCache) setDetail(slug string, detail *PublicCampaignDetailDTO, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.detailEntries[slug] = bursaDetailCacheEntry{
		expiresAt: time.Now().Add(ttl),
		detail:    detail,
	}
}
