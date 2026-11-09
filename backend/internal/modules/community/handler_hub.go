package community

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

var (
	hubThreadsCacheLock sync.RWMutex
	hubThreadsCacheData []ThreadDTO
	hubThreadsCacheExp  time.Time
)

func RegisterHubHandlers(api huma.API, svc *Service, pool *pgxpool.Pool, q *gen.Queries) {
	registerCreateHubThread(api, svc)
	registerListHubThreads(api, svc)
	registerGetThread(api, svc)
	registerCreateComment(api, svc)
	registerListComments(api, svc)
	registerToggleVote(api, pool, q)
	RegisterThreadOpsHandlers(api, q)
}

func registerCreateHubThread(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "communityCreateHubThread",
		Method:      http.MethodPost,
		Path:        "/api/v1/community/hub/threads",
		Summary:     "Create a new discussion or bounty in the public hub",
		Tags:        []string{"CommunityHub"},
	}, func(ctx context.Context, in *struct {
		Body struct {
			Kind              string `json:"kind"`
			Title             string `json:"title"`
			Content           string `json:"content"`
			SharedMetricsJSON string `json:"shared_metrics_json,omitempty"`
		}
	}) (*struct{ Body *ThreadDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		authorUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		var metrics []byte
		if in.Body.SharedMetricsJSON != "" {
			metrics = []byte(in.Body.SharedMetricsJSON)
		}

		res, err := svc.CreateHubThread(ctx, authorUUID, in.Body.Kind, in.Body.Title, in.Body.Content, metrics)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *ThreadDTO }{Body: res}, nil
	})
}

func registerListHubThreads(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "communityListHubThreads",
		Method:      http.MethodGet,
		Path:        "/api/v1/community/hub/threads",
		Summary:     "List public hub discussions and bounties",
		Tags:        []string{"CommunityHub"},
	}, func(ctx context.Context, in *struct {
		Limit int32 `query:"limit"`
	}) (*struct{ Body []ThreadDTO }, error) {
		var currentUserID *uuid.UUID
		if p, ok := middleware.GetPrincipal(ctx); ok && p != nil {
			if u, parseErr := uuid.Parse(p.UserID); parseErr == nil {
				currentUserID = &u
			}
		}

		if currentUserID == nil {
			hubThreadsCacheLock.RLock()
			if time.Now().Before(hubThreadsCacheExp) && hubThreadsCacheData != nil {
				cached := hubThreadsCacheData
				hubThreadsCacheLock.RUnlock()
				return &struct{ Body []ThreadDTO }{Body: cached}, nil
			}
			hubThreadsCacheLock.RUnlock()
		}

		threads, err := svc.ListPublicHubThreads(ctx, in.Limit, currentUserID)
		if err != nil {
			return nil, mapAppError(err)
		}
		if currentUserID == nil {
			hubThreadsCacheLock.Lock()
			hubThreadsCacheData = threads
			hubThreadsCacheExp = time.Now().Add(30 * time.Second)
			hubThreadsCacheLock.Unlock()
		}
		return &struct{ Body []ThreadDTO }{Body: threads}, nil
	})
}

func registerGetThread(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "communityGetThread",
		Method:      http.MethodGet,
		Path:        "/api/v1/community/threads/{id}",
		Summary:     "Get thread detail and access checks",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct{ Body *ThreadDTO }, error) {
		threadUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid thread id")
		}

		var currentUserID *uuid.UUID
		if p, ok := middleware.GetPrincipal(ctx); ok && p != nil {
			if u, parseErr := uuid.Parse(p.UserID); parseErr == nil {
				currentUserID = &u
			}
		}

		res, err := svc.GetThread(ctx, threadUUID, currentUserID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *ThreadDTO }{Body: res}, nil
	})
}

func registerCreateComment(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "communityCreateComment",
		Method:      http.MethodPost,
		Path:        "/api/v1/community/threads/{id}/comments",
		Summary:     "Post a reply to a thread",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		ID   string `path:"id"`
		Body struct {
			Content string `json:"content"`
		}
	}) (*struct{ Body *CommentDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		authorUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}
		threadUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid thread id")
		}

		res, err := svc.CreateComment(ctx, threadUUID, authorUUID, in.Body.Content)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *CommentDTO }{Body: res}, nil
	})
}

func registerListComments(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "communityListComments",
		Method:      http.MethodGet,
		Path:        "/api/v1/community/threads/{id}/comments",
		Summary:     "List replies for a thread",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct{ Body []CommentDTO }, error) {
		threadUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid thread id")
		}
		var currentUserID *uuid.UUID
		if p, ok := middleware.GetPrincipal(ctx); ok && p != nil {
			if u, parseErr := uuid.Parse(p.UserID); parseErr == nil {
				currentUserID = &u
			}
		}
		comments, err := svc.ListComments(ctx, threadUUID, currentUserID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []CommentDTO }{Body: comments}, nil
	})
}

func registerToggleVote(api huma.API, pool *pgxpool.Pool, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityToggleVote",
		Method:      http.MethodPost,
		Path:        "/api/v1/community/threads/{id}/vote",
		Summary:     "Toggle upvote on a thread",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct{ Body *VoteResult }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}
		threadUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid thread id")
		}

		res, err := ToggleVote(ctx, pool, q, threadUUID, userUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *VoteResult }{Body: res}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
