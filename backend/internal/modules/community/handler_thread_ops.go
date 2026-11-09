package community

import (
	"context"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

func RegisterThreadOpsHandlers(api huma.API, q *gen.Queries) {
	registerListMyThreads(api, q)
	registerUpdateThread(api, q)
	registerDeleteThread(api, q)
}

func registerListMyThreads(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityListMyThreads",
		Method:      http.MethodGet,
		Path:        "/api/v1/community/me/threads",
		Summary:     "List all community threads created by current user",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		Limit int32 `query:"limit" default:"50"`
	}) (*struct{ Body []ThreadDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		limit := in.Limit
		if limit <= 0 || limit > 100 {
			limit = 50
		}

		rows, err := q.ListUserThreads(ctx, gen.ListUserThreadsParams{
			AuthorID: pgtype.UUID{Bytes: userUUID, Valid: true},
			Limit:    limit,
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal memuat postingan: "+err.Error())
		}

		return &struct{ Body []ThreadDTO }{Body: buildUserThreadsDTO(rows)}, nil
	})
}

func buildUserThreadsDTO(rows []gen.ListUserThreadsRow) []ThreadDTO {
	res := make([]ThreadDTO, len(rows))
	for i, r := range rows {
		res[i] = ThreadDTO{
			ID:               uuid.UUID(r.ID.Bytes).String(),
			AuthorID:         uuid.UUID(r.AuthorID.Bytes).String(),
			AuthorName:       r.AuthorName,
			AuthorRole:       string(r.AuthorRole),
			Visibility:       r.Visibility,
			Kind:             r.Kind,
			Title:            r.Title,
			Content:          r.Content,
			CommentCount:     r.CommentCount,
			UpvotesCount:     r.UpvotesCount,
			IsDeletedByAdmin: r.IsDeletedByAdmin,
			CreatedAt:        r.CreatedAt.Time,
		}
		if r.AdminDeleteReason.Valid {
			res[i].AdminDeleteReason = &r.AdminDeleteReason.String
		}
		if r.GroupID.Valid {
			gid := uuid.UUID(r.GroupID.Bytes).String()
			res[i].GroupID = &gid
		}
		if r.GroupName.Valid {
			res[i].GroupName = &r.GroupName.String
		}
		if r.GroupSlug.Valid {
			res[i].GroupSlug = &r.GroupSlug.String
		}
	}
	return res
}

type UpdateThreadInput struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Kind    string `json:"kind,omitempty"`
}

func registerUpdateThread(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityUpdateThread",
		Method:      http.MethodPut,
		Path:        "/api/v1/community/threads/{id}",
		Summary:     "Update a community thread owned by current user",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		ID   string            `path:"id"`
		Body UpdateThreadInput `json:"body"`
	}) (*struct{ Body *ThreadDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		dto, err := handleUpdateThread(ctx, q, in.ID, p, in.Body)
		if err != nil {
			return nil, err
		}
		return &struct{ Body *ThreadDTO }{Body: dto}, nil
	})
}

func handleUpdateThread(ctx context.Context, q *gen.Queries, threadID string, p *middleware.Principal, in UpdateThreadInput) (*ThreadDTO, error) {
	threadUUID, err := uuid.Parse(threadID)
	if err != nil {
		return nil, huma.NewError(http.StatusBadRequest, "Invalid thread id")
	}
	userUUID, err := uuid.Parse(p.UserID)
	if err != nil {
		return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
	}

	title := strings.TrimSpace(in.Title)
	content := strings.TrimSpace(in.Content)
	if title == "" || content == "" {
		return nil, huma.NewError(http.StatusBadRequest, "Judul dan isi tidak boleh kosong")
	}
	kind := in.Kind
	if kind != "bounty" {
		kind = "discussion"
	}

	th, err := q.UpdateThread(ctx, gen.UpdateThreadParams{
		ID:       pgtype.UUID{Bytes: threadUUID, Valid: true},
		AuthorID: pgtype.UUID{Bytes: userUUID, Valid: true},
		Title:    title,
		Content:  content,
		Kind:     kind,
	})
	if err != nil {
		return nil, huma.NewError(http.StatusNotFound, "Postingan tidak ditemukan atau Anda tidak memiliki izin mengedit")
	}

	dto := &ThreadDTO{
		ID:           uuid.UUID(th.ID.Bytes).String(),
		AuthorID:     userUUID.String(),
		AuthorName:   resolveAuthorName(ctx, q, pgtype.UUID{Bytes: userUUID, Valid: true}),
		AuthorRole:   p.Role,
		Visibility:   string(th.Visibility),
		Kind:         string(th.Kind),
		Title:        th.Title,
		Content:      th.Content,
		UpvotesCount: th.UpvotesCount,
		CreatedAt:    th.CreatedAt.Time,
	}
	if th.GroupID.Valid {
		gid := uuid.UUID(th.GroupID.Bytes).String()
		dto.GroupID = &gid
	}
	return dto, nil
}

func registerDeleteThread(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityDeleteThread",
		Method:      http.MethodDelete,
		Path:        "/api/v1/community/threads/{id}",
		Summary:     "Delete a community thread owned by current user",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct {
		Body struct {
			Status string `json:"status"`
		}
	}, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		threadUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid thread id")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		if err := q.DeleteThread(ctx, gen.DeleteThreadParams{
			ID:       pgtype.UUID{Bytes: threadUUID, Valid: true},
			AuthorID: pgtype.UUID{Bytes: userUUID, Valid: true},
		}); err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal menghapus postingan: "+err.Error())
		}

		return &struct {
			Body struct {
				Status string `json:"status"`
			}
		}{
			Body: struct {
				Status string `json:"status"`
			}{Status: "deleted"},
		}, nil
	})
}
