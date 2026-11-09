package scheduler

import (
	"context"
	"log/slog"
)

type CampaignCloser interface {
	CloseExpiredCampaigns(ctx context.Context) (int, error)
}

func RunCampaignCloseJob(ctx context.Context, closer CampaignCloser) error {
	if closer == nil {
		return nil
	}
	closed, err := closer.CloseExpiredCampaigns(ctx)
	if err != nil {
		slog.Error("campaign close job error", "error", err)
		return err
	}
	if closed > 0 {
		slog.Info("campaign close job completed", "closed_count", closed)
	}
	return nil
}
