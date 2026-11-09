package scheduler

import (
	"context"
	"fmt"
	"time"
	_ "time/tzdata"

	"github.com/go-co-op/gocron/v2"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/modules/aicopilot"
)

type Scheduler struct {
	cron     gocron.Scheduler
	pipeline *aicopilot.Pipeline
	closer   CampaignCloser
	q        *gen.Queries
}

func NewScheduler(pipeline *aicopilot.Pipeline, q *gen.Queries, closer CampaignCloser) (*Scheduler, error) {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		loc = time.FixedZone("WIB", 7*3600)
	}

	cron, err := gocron.NewScheduler(gocron.WithLocation(loc))
	if err != nil {
		return nil, fmt.Errorf("create gocron scheduler: %w", err)
	}

	s := &Scheduler{
		cron:     cron,
		pipeline: pipeline,
		closer:   closer,
		q:        q,
	}

	if err := s.registerJobs(); err != nil {
		return nil, err
	}

	return s, nil
}

func (s *Scheduler) registerJobs() error {

	_, err := s.cron.NewJob(
		gocron.DailyJob(1, gocron.NewAtTimes(gocron.NewAtTime(0, 0, 0))),
		gocron.NewTask(func() {
			_ = RunAIDailyJob(context.Background(), s.q, s.pipeline)
		}),
		gocron.WithName("ai_daily"),
	)
	if err != nil {
		return fmt.Errorf("register ai_daily job: %w", err)
	}

	if s.closer != nil {
		_, err = s.cron.NewJob(
			gocron.DurationJob(15*time.Minute),
			gocron.NewTask(func() {
				_ = RunCampaignCloseJob(context.Background(), s.closer)
			}),
			gocron.WithName("campaign_close"),
		)
		if err != nil {
			return fmt.Errorf("register campaign_close job: %w", err)
		}
	}
	return nil
}

func (s *Scheduler) Start() {
	s.cron.Start()
}

func (s *Scheduler) Stop() error {
	return s.cron.Shutdown()
}
