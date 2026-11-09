package cache

import (
	"sync"
	"sync/atomic"
	"time"
)

type BudgetGuard struct {
	maxDaily   int64
	currentDay int
	commands   atomic.Int64
	mu         sync.Mutex
}

func NewBudgetGuard(maxDaily int64) *BudgetGuard {
	if maxDaily <= 0 {
		maxDaily = 14000
	}
	return &BudgetGuard{
		maxDaily:   maxDaily,
		currentDay: time.Now().UTC().YearDay(),
	}
}

func (b *BudgetGuard) RecordCommand() bool {
	b.checkDayRollover()
	count := b.commands.Add(1)
	return count <= b.maxDaily
}

func (b *BudgetGuard) AllowL2() bool {
	b.checkDayRollover()
	return b.commands.Load() < b.maxDaily
}

func (b *BudgetGuard) CurrentCount() int64 {
	b.checkDayRollover()
	return b.commands.Load()
}

func (b *BudgetGuard) checkDayRollover() {
	today := time.Now().UTC().YearDay()
	if b.currentDay != today {
		b.mu.Lock()
		defer b.mu.Unlock()
		if b.currentDay != today {
			b.currentDay = today
			b.commands.Store(0)
		}
	}
}
