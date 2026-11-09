package scheduler

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/modules/aicopilot"
)

func RunAIDailyJob(ctx context.Context, q *gen.Queries, pipeline *aicopilot.Pipeline) error {
	for {
		claimed, err := q.ClaimDueSMEs(ctx)
		if err != nil {
			return fmt.Errorf("claim due smes: %w", err)
		}
		if len(claimed) == 0 {
			break
		}

		var wg sync.WaitGroup
		sem := make(chan struct{}, 5)

		for _, row := range claimed {
			sem <- struct{}{}
			wg.Add(1)
			go func(r gen.ClaimDueSMEsRow) {
				defer func() {
					<-sem
					wg.Done()
				}()
				if runErr := pipeline.RunAnalysis(ctx, r.ID, r.AiInterval); runErr != nil {
					slog.Warn("ai analysis failed for sme", "sme_id", r.ID, "err", runErr)
				}
			}(row)
		}
		wg.Wait()
	}

	return nil
}
