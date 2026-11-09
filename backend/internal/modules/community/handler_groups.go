package community

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

type CommunityGroupDTO struct {
	ID          string `json:"id"`
	Slug        string `json:"slug"`
	Sector      string `json:"sector"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IconName    string `json:"icon_name"`
	MemberCount int64  `json:"member_count"`
	IsMember    bool   `json:"is_member"`
}

type CreateGroupInput struct {
	Name        string `json:"name"`
	Sector      string `json:"sector"`
	Description string `json:"description"`
	IconName    string `json:"icon_name"`
}

func RegisterGroupHandlers(api huma.API, q *gen.Queries) {
	registerListGroups(api, q)
	registerJoinGroup(api, q)
	registerLeaveGroup(api, q)
	registerCreateGroup(api, q)
	registerListGroupThreads(api, q)
	registerCreateGroupThread(api, q)
}

func registerListGroups(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityListGroups",
		Method:      http.MethodGet,
		Path:        "/api/v1/community/groups",
		Summary:     "List sectoral business community groups",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct{}) (*struct{ Body []CommunityGroupDTO }, error) {
		groups, err := q.ListCommunityGroups(ctx)
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal memuat grup komunitas")
		}

		var uID *uuid.UUID
		if p, ok := middleware.GetPrincipal(ctx); ok && p != nil {
			if parsed, err := uuid.Parse(p.UserID); err == nil {
				uID = &parsed
			}
		}

		res := make([]CommunityGroupDTO, len(groups))
		for i, g := range groups {
			isMember := false
			if uID != nil {
				isMember, _ = q.IsUserInCommunityGroup(ctx, gen.IsUserInCommunityGroupParams{
					GroupID: g.ID,
					UserID:  pgtype.UUID{Bytes: *uID, Valid: true},
				})
			}
			res[i] = CommunityGroupDTO{
				ID:          uuid.UUID(g.ID.Bytes).String(),
				Slug:        g.Slug,
				Sector:      g.Sector,
				Name:        g.Name,
				Description: g.Description,
				IconName:    g.IconName,
				MemberCount: g.MemberCount,
				IsMember:    isMember,
			}
		}
		return &struct{ Body []CommunityGroupDTO }{Body: res}, nil
	})
}

func registerJoinGroup(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityJoinGroup",
		Method:      http.MethodPost,
		Path:        "/api/v1/community/groups/{id}/join",
		Summary:     "Join a sectoral business group",
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
		groupUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid group id")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		err = q.JoinCommunityGroup(ctx, gen.JoinCommunityGroupParams{
			GroupID: pgtype.UUID{Bytes: groupUUID, Valid: true},
			UserID:  pgtype.UUID{Bytes: userUUID, Valid: true},
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal bergabung ke grup: "+err.Error())
		}

		return &struct {
			Body struct {
				Status string `json:"status"`
			}
		}{
			Body: struct {
				Status string `json:"status"`
			}{Status: "joined"},
		}, nil
	})
}

func registerLeaveGroup(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityLeaveGroup",
		Method:      http.MethodPost,
		Path:        "/api/v1/community/groups/{id}/leave",
		Summary:     "Leave a sectoral business group",
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
		groupUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid group id")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		err = q.LeaveCommunityGroup(ctx, gen.LeaveCommunityGroupParams{
			GroupID: pgtype.UUID{Bytes: groupUUID, Valid: true},
			UserID:  pgtype.UUID{Bytes: userUUID, Valid: true},
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal keluar dari grup: "+err.Error())
		}

		return &struct {
			Body struct {
				Status string `json:"status"`
			}
		}{
			Body: struct {
				Status string `json:"status"`
			}{Status: "left"},
		}, nil
	})
}

func registerCreateGroup(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityCreateGroup",
		Method:      http.MethodPost,
		Path:        "/api/v1/community/groups",
		Summary:     "Create a new business community group",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		Body CreateGroupInput
	}) (*struct{ Body *CommunityGroupDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}

		slug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(in.Body.Name), " ", "-"))
		if slug == "" {
			slug = "grup-" + uuid.New().String()[:8]
		}
		icon := in.Body.IconName
		if icon == "" {
			icon = "users"
		}

		g, err := q.CreateCommunityGroup(ctx, gen.CreateCommunityGroupParams{
			Slug:        slug,
			Sector:      in.Body.Sector,
			Name:        in.Body.Name,
			Description: in.Body.Description,
			IconName:    icon,
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal membuat grup: "+err.Error())
		}

		userUUID, _ := uuid.Parse(p.UserID)
		_ = q.JoinCommunityGroup(ctx, gen.JoinCommunityGroupParams{
			GroupID: g.ID,
			UserID:  pgtype.UUID{Bytes: userUUID, Valid: true},
		})

		return &struct{ Body *CommunityGroupDTO }{
			Body: &CommunityGroupDTO{
				ID:          uuid.UUID(g.ID.Bytes).String(),
				Slug:        g.Slug,
				Sector:      g.Sector,
				Name:        g.Name,
				Description: g.Description,
				IconName:    g.IconName,
				MemberCount: 1,
				IsMember:    true,
			},
		}, nil
	})
}

func registerListGroupThreads(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityListGroupThreads",
		Method:      http.MethodGet,
		Path:        "/api/v1/community/groups/{id}/threads",
		Summary:     "List discussions inside a community group",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct{ Body []ThreadDTO }, error) {
		groupUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid group id")
		}

		threads, err := q.ListGroupThreads(ctx, gen.ListGroupThreadsParams{
			GroupID: pgtype.UUID{Bytes: groupUUID, Valid: true},
			Limit:   50,
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal memuat diskusi grup: "+err.Error())
		}

		res := make([]ThreadDTO, len(threads))
		for i, t := range threads {
			res[i] = ThreadDTO{
				ID:               uuid.UUID(t.ID.Bytes).String(),
				AuthorID:         uuid.UUID(t.AuthorID.Bytes).String(),
				AuthorName:       t.AuthorName,
				AuthorRole:       string(t.AuthorRole),
				Visibility:       string(t.Visibility),
				Kind:             string(t.Kind),
				Title:            t.Title,
				Content:          t.Content,
				CommentCount:     t.CommentCount,
				UpvotesCount:     t.UpvotesCount,
				IsDeletedByAdmin: t.IsDeletedByAdmin,
				CreatedAt:        t.CreatedAt.Time,
			}
			if t.AdminDeleteReason.Valid {
				res[i].AdminDeleteReason = &t.AdminDeleteReason.String
			}
			if t.GroupID.Valid {
				gid := uuid.UUID(t.GroupID.Bytes).String()
				res[i].GroupID = &gid
			}
			if t.GroupName.Valid {
				res[i].GroupName = &t.GroupName.String
			}
			if t.GroupSlug.Valid {
				res[i].GroupSlug = &t.GroupSlug.String
			}
		}
		return &struct{ Body []ThreadDTO }{Body: res}, nil
	})
}

type CreateGroupThreadInput struct {
	Kind    string `json:"kind"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

func registerCreateGroupThread(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "communityCreateGroupThread",
		Method:      http.MethodPost,
		Path:        "/api/v1/community/groups/{id}/threads",
		Summary:     "Create a discussion topic inside a community group",
		Tags:        []string{"Community"},
	}, func(ctx context.Context, in *struct {
		ID   string                 `path:"id"`
		Body CreateGroupThreadInput `json:"body"`
	}) (*struct{ Body *ThreadDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		dto, err := handleCreateGroupThread(ctx, q, in.ID, p, in.Body)
		if err != nil {
			return nil, err
		}
		return &struct{ Body *ThreadDTO }{Body: dto}, nil
	})
}

func handleCreateGroupThread(ctx context.Context, q *gen.Queries, groupID string, p *middleware.Principal, in CreateGroupThreadInput) (*ThreadDTO, error) {
	groupUUID, err := uuid.Parse(groupID)
	if err != nil {
		return nil, huma.NewError(http.StatusBadRequest, "Invalid group id")
	}
	userUUID, err := uuid.Parse(p.UserID)
	if err != nil {
		return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
	}

	if chkErr := checkUserGroupAndSuspension(ctx, q, groupUUID, userUUID); chkErr != nil {
		return nil, chkErr
	}

	title := strings.TrimSpace(in.Title)
	content := strings.TrimSpace(in.Content)
	if title == "" || content == "" {
		return nil, huma.NewError(http.StatusBadRequest, "Judul dan isi postingan tidak boleh kosong")
	}

	kind := "discussion"
	if in.Kind == "bounty" {
		kind = "bounty"
	}

	th, err := q.CreateThreadWithGroup(ctx, gen.CreateThreadWithGroupParams{
		SmeID:              pgtype.UUID{Valid: false},
		AuthorID:           pgtype.UUID{Bytes: userUUID, Valid: true},
		Visibility:         "public_hub",
		Kind:               kind,
		Title:              title,
		Content:            content,
		SharedMetricsJson:  nil,
		AttachedAiReportID: pgtype.UUID{Valid: false},
		GroupID:            pgtype.UUID{Bytes: groupUUID, Valid: true},
	})
	if err != nil {
		return nil, huma.NewError(http.StatusInternalServerError, "Gagal membuat postingan grup: "+err.Error())
	}

	return &ThreadDTO{
		ID:           uuid.UUID(th.ID.Bytes).String(),
		AuthorID:     userUUID.String(),
		AuthorName:   resolveAuthorName(ctx, q, pgtype.UUID{Bytes: userUUID, Valid: true}),
		AuthorRole:   p.Role,
		Visibility:   string(th.Visibility),
		Kind:         string(th.Kind),
		Title:        th.Title,
		Content:      th.Content,
		GroupID:      &groupID,
		CommentCount: 0,
		UpvotesCount: 0,
		CreatedAt:    th.CreatedAt.Time,
	}, nil
}

func checkUserGroupAndSuspension(ctx context.Context, q *gen.Queries, groupUUID, userUUID uuid.UUID) error {
	author, err := q.GetUserByID(ctx, pgtype.UUID{Bytes: userUUID, Valid: true})
	if err == nil && author.SuspendedUntil.Valid && author.SuspendedUntil.Time.After(time.Now()) {
		reason := "Pelanggaran tata tertib komunitas"
		if author.SuspensionReason.Valid && author.SuspensionReason.String != "" {
			reason = author.SuspensionReason.String
		}
		return huma.NewError(http.StatusForbidden, fmt.Sprintf("Akun Anda sedang ditangguhkan hingga %s. Alasan: %s", author.SuspendedUntil.Time.Format("02 Jan 2006 15:04"), reason))
	}

	isMember, err := q.IsUserInCommunityGroup(ctx, gen.IsUserInCommunityGroupParams{
		GroupID: pgtype.UUID{Bytes: groupUUID, Valid: true},
		UserID:  pgtype.UUID{Bytes: userUUID, Valid: true},
	})
	if err != nil || !isMember {
		return huma.NewError(http.StatusForbidden, "Anda harus bergabung dengan grup ini terlebih dahulu untuk membuat postingan")
	}
	return nil
}

func resolveAuthorName(ctx context.Context, q *gen.Queries, u pgtype.UUID) string {
	if user, err := q.GetUserByID(ctx, u); err == nil && user.FullName != "" {
		return user.FullName
	}
	return "Anggota Komunitas"
}
