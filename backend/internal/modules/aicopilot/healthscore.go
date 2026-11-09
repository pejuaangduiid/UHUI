package aicopilot

import (
	"github.com/uhui/backend/internal/money"
)

func HealthScore(compA int, compB *int, compC int) int {
	var score int64
	if compB != nil {
		total := int64(compA + *compB + compC)
		score, _ = money.FloorDiv(total, 3)
	} else {
		total := int64(compA + compC)
		score, _ = money.FloorDiv(total, 2)
	}
	return int(money.Clamp(score, 0, 100))
}
