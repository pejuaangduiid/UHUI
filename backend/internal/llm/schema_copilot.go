package llm

import (
	"errors"
	"fmt"
	"strings"
)

var (
	ErrOutputNil           = errors.New("copilot: output is nil")
	ErrActionItemCountNot3 = errors.New("copilot: action_items count must be exactly 3")
	ErrActionItemTooLong   = errors.New("copilot: action item text exceeds 200 characters")
	ErrActionItemEmpty     = errors.New("copilot: action item text cannot be empty")
	ErrSummaryEmpty        = errors.New("copilot: summary_text cannot be empty")
	ErrSummaryTooLong      = errors.New("copilot: summary_text exceeds 2000 characters")
	ErrForeignAnomalyID    = errors.New("copilot: detected anomaly references unknown candidate id")
)

func ValidateCopilotOutput(out *InsightOutput, allowedCandidateIDs []string) error {
	if out == nil {
		return ErrOutputNil
	}

	if len(out.ActionItems) != 3 {
		return fmt.Errorf("%w: got %d", ErrActionItemCountNot3, len(out.ActionItems))
	}

	for i, item := range out.ActionItems {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			return fmt.Errorf("%w at index %d", ErrActionItemEmpty, i)
		}
		if len(item) > 200 {
			return fmt.Errorf("%w at index %d (len %d)", ErrActionItemTooLong, i, len(item))
		}
	}

	trimmedSummary := strings.TrimSpace(out.SummaryText)
	if trimmedSummary == "" {
		return ErrSummaryEmpty
	}
	if len(out.SummaryText) > 2000 {
		return fmt.Errorf("%w (len %d)", ErrSummaryTooLong, len(out.SummaryText))
	}

	allowedMap := make(map[string]bool, len(allowedCandidateIDs))
	for _, id := range allowedCandidateIDs {
		allowedMap[id] = true
	}

	for _, anomaly := range out.Anomalies {
		if !allowedMap[anomaly] {
			return fmt.Errorf("%w: %q", ErrForeignAnomalyID, anomaly)
		}
	}

	return nil
}
