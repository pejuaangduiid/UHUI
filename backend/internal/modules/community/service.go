package community

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

type ThreadDTO struct {
	CreatedAt          time.Time `json:"created_at"`
	SMEID              *string   `json:"sme_id,omitempty"`
	AttachedAIReportID *string   `json:"attached_ai_report_id,omitempty"`
	GroupID            *string   `json:"group_id,omitempty"`
	GroupName          *string   `json:"group_name,omitempty"`
	GroupSlug          *string   `json:"group_slug,omitempty"`
	AdminDeleteReason  *string   `json:"admin_delete_reason,omitempty"`
	ID                 string    `json:"id"`
	AuthorID           string    `json:"author_id"`
	AuthorName         string    `json:"author_name"`
	AuthorRole         string    `json:"author_role"`
	Visibility         string    `json:"visibility"`
	Kind               string    `json:"kind"`
	Title              string    `json:"title"`
	Content            string    `json:"content"`
	SharedMetricsJSON  string    `json:"shared_metrics_json,omitempty"`
	CommentCount       int64     `json:"comment_count"`
	UpvotesCount       int32     `json:"upvotes_count"`
	HasVoted           bool      `json:"has_voted"`
	IsDeletedByAdmin   bool      `json:"is_deleted_by_admin"`
}

type CommentDTO struct {
	CreatedAt         time.Time `json:"created_at"`
	AdminDeleteReason *string   `json:"admin_delete_reason,omitempty"`
	ID                string    `json:"id"`
	ThreadID          string    `json:"thread_id"`
	AuthorID          string    `json:"author_id"`
	AuthorName        string    `json:"author_name"`
	AuthorRole        string    `json:"author_role"`
	Content           string    `json:"content"`
	IsDeletedByAdmin  bool      `json:"is_deleted_by_admin"`
}

type Service struct {
	q *gen.Queries
}

func NewService(_ *pgxpool.Pool, q *gen.Queries) *Service {
	return &Service{q: q}
}

func (s *Service) checkAuthorSuspended(ctx context.Context, authorID uuid.UUID) error {
	author, err := s.q.GetUserByID(ctx, pgtype.UUID{Bytes: authorID, Valid: true})
	if err == nil && author.SuspendedUntil.Valid && author.SuspendedUntil.Time.After(time.Now()) {
		reason := "Pelanggaran tata tertib komunitas"
		if author.SuspensionReason.Valid && author.SuspensionReason.String != "" {
			reason = author.SuspensionReason.String
		}
		return apperr.Forbidden("USER_SUSPENDED", fmt.Sprintf("Akun Anda sedang ditangguhkan hingga %s. Alasan: %s", author.SuspendedUntil.Time.Format("02 Jan 2006 15:04"), reason), "")
	}
	return nil
}

func (s *Service) CreateHubThread(ctx context.Context, authorID uuid.UUID, kind, title, content string, metricsJSON []byte) (*ThreadDTO, error) {
	if err := s.checkAuthorSuspended(ctx, authorID); err != nil {
		return nil, err
	}
	if title == "" || content == "" {
		return nil, apperr.BadRequest("INVALID_INPUT", "Judul dan isi postingan tidak boleh kosong", "")
	}
	if kind != "discussion" && kind != "bounty" {
		kind = "discussion"
	}

	th, err := s.q.CreateThread(ctx, gen.CreateThreadParams{
		AuthorID:          pgtype.UUID{Bytes: authorID, Valid: true},
		Visibility:        "public_hub",
		Kind:              kind,
		Title:             title,
		Content:           content,
		SharedMetricsJson: metricsJSON,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal membuat thread di hub: " + err.Error())
	}
	return s.GetThread(ctx, uuid.UUID(th.ID.Bytes), &authorID)
}

func (s *Service) CreateBoardroomThread(ctx context.Context, smeID, authorID uuid.UUID, kind, title, content string, aiReportID *uuid.UUID) (*ThreadDTO, error) {
	if err := s.checkAuthorSuspended(ctx, authorID); err != nil {
		return nil, err
	}
	hasAccess, err := CanAccessBoardroom(ctx, s.q, smeID, authorID)
	if err != nil || !hasAccess {
		return nil, apperr.Forbidden("BOARDROOM_ACCESS_DENIED", "Akses ruang rapat khusus pemilik UMKM dan pemegang saham terkonfirmasi", "")
	}
	if title == "" || content == "" {
		return nil, apperr.BadRequest("INVALID_INPUT", "Judul dan isi pesan tidak boleh kosong", "")
	}
	if kind != "discussion" && kind != "bounty" {
		kind = "discussion"
	}

	var reportUUID pgtype.UUID
	if aiReportID != nil {
		reportUUID = pgtype.UUID{Bytes: *aiReportID, Valid: true}
	}

	th, err := s.q.CreateThread(ctx, gen.CreateThreadParams{
		SmeID:              pgtype.UUID{Bytes: smeID, Valid: true},
		AuthorID:           pgtype.UUID{Bytes: authorID, Valid: true},
		Visibility:         "private_boardroom",
		Kind:               kind,
		Title:              title,
		Content:            content,
		AttachedAiReportID: reportUUID,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal membuat thread boardroom: " + err.Error())
	}
	return s.GetThread(ctx, uuid.UUID(th.ID.Bytes), &authorID)
}

func (s *Service) ListPublicHubThreads(ctx context.Context, limit int32, currentUserID *uuid.UUID) ([]ThreadDTO, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	rows, err := s.q.ListPublicHubThreads(ctx, limit)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat threads: " + err.Error())
	}

	res := make([]ThreadDTO, len(rows))
	for i, r := range rows {
		hasVoted := false
		if currentUserID != nil {
			hasVoted, _ = s.q.HasUserVoted(ctx, gen.HasUserVotedParams{
				ThreadID: r.ID,
				UserID:   pgtype.UUID{Bytes: *currentUserID, Valid: true},
			})
		}
		res[i] = mapPublicHubRowToDTO(r, hasVoted)
	}
	return res, nil
}

func (s *Service) ListBoardroomThreads(ctx context.Context, smeID, currentUserID uuid.UUID, limit int32) ([]ThreadDTO, error) {
	hasAccess, err := CanAccessBoardroom(ctx, s.q, smeID, currentUserID)
	if err != nil || !hasAccess {
		return nil, apperr.Forbidden("BOARDROOM_ACCESS_DENIED", "Akses ruang rapat khusus pemilik UMKM dan pemegang saham", "")
	}
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	rows, err := s.q.ListBoardroomThreads(ctx, gen.ListBoardroomThreadsParams{
		SmeID: pgtype.UUID{Bytes: smeID, Valid: true},
		Limit: limit,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal memuat threads boardroom: " + err.Error())
	}

	res := make([]ThreadDTO, len(rows))
	for i, r := range rows {
		hasVoted, _ := s.q.HasUserVoted(ctx, gen.HasUserVotedParams{
			ThreadID: r.ID,
			UserID:   pgtype.UUID{Bytes: currentUserID, Valid: true},
		})
		res[i] = mapBoardroomRowToDTO(r, hasVoted)
	}
	return res, nil
}

func (s *Service) GetThread(ctx context.Context, threadID uuid.UUID, currentUserID *uuid.UUID) (*ThreadDTO, error) {
	r, err := s.q.GetThreadByID(ctx, pgtype.UUID{Bytes: threadID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("THREAD_NOT_FOUND", "Thread tidak ditemukan", "")
	}
	if r.Visibility == "private_boardroom" {
		if currentUserID == nil {
			return nil, apperr.Unauthorized("UNAUTHORIZED", "Autentikasi diperlukan", "")
		}
		hasAccess, err := CanAccessBoardroom(ctx, s.q, uuid.UUID(r.SmeID.Bytes), *currentUserID)
		if err != nil || !hasAccess {
			return nil, apperr.Forbidden("BOARDROOM_ACCESS_DENIED", "Tidak memiliki akses ke ruang rapat ini", "")
		}
	}

	hasVoted := false
	if currentUserID != nil {
		hasVoted, _ = s.q.HasUserVoted(ctx, gen.HasUserVotedParams{
			ThreadID: r.ID,
			UserID:   pgtype.UUID{Bytes: *currentUserID, Valid: true},
		})
	}
	return mapThreadRowToDTO(r, hasVoted), nil
}

func (s *Service) CreateComment(ctx context.Context, threadID, authorID uuid.UUID, content string) (*CommentDTO, error) {
	if err := s.checkAuthorSuspended(ctx, authorID); err != nil {
		return nil, err
	}
	if content == "" {
		return nil, apperr.BadRequest("INVALID_CONTENT", "Isi komentar tidak boleh kosong", "")
	}
	r, err := s.q.GetThreadByID(ctx, pgtype.UUID{Bytes: threadID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("THREAD_NOT_FOUND", "Thread tidak ditemukan", "")
	}
	if r.Visibility == "private_boardroom" {
		hasAccess, accErr := CanAccessBoardroom(ctx, s.q, uuid.UUID(r.SmeID.Bytes), authorID)
		if accErr != nil || !hasAccess {
			return nil, apperr.Forbidden("BOARDROOM_ACCESS_DENIED", "Tidak memiliki akses ke ruang rapat ini", "")
		}
	}

	c, err := s.q.CreateComment(ctx, gen.CreateCommentParams{
		ThreadID: pgtype.UUID{Bytes: threadID, Valid: true},
		AuthorID: pgtype.UUID{Bytes: authorID, Valid: true},
		Content:  content,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal menyimpan komentar: " + err.Error())
	}

	author, _ := s.q.GetUserByID(ctx, c.AuthorID)
	authorRole := string(author.Role)
	if author.Role == "admin" || author.Role == "superadmin" {
		authorRole = "admin"
	} else if r.Visibility == "private_boardroom" {
		if r.SmeID.Valid {
			sme, err := s.q.GetSMEByID(ctx, r.SmeID)
			if err == nil && sme.OwnerID == c.AuthorID {
				authorRole = "sme_owner"
			} else {
				authorRole = "investor"
			}
		} else {
			authorRole = "investor"
		}
	}

	return &CommentDTO{
		ID:         uuid.UUID(c.ID.Bytes).String(),
		ThreadID:   uuid.UUID(c.ThreadID.Bytes).String(),
		AuthorID:   uuid.UUID(c.AuthorID.Bytes).String(),
		AuthorName: author.FullName,
		AuthorRole: authorRole,
		Content:    c.Content,
		CreatedAt:  c.CreatedAt.Time,
	}, nil
}

func (s *Service) ListComments(ctx context.Context, threadID uuid.UUID, currentUserID *uuid.UUID) ([]CommentDTO, error) {
	r, err := s.q.GetThreadByID(ctx, pgtype.UUID{Bytes: threadID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("THREAD_NOT_FOUND", "Thread tidak ditemukan", "")
	}
	if r.Visibility == "private_boardroom" {
		if currentUserID == nil {
			return nil, apperr.Unauthorized("UNAUTHORIZED", "Autentikasi diperlukan", "")
		}
		hasAccess, accErr := CanAccessBoardroom(ctx, s.q, uuid.UUID(r.SmeID.Bytes), *currentUserID)
		if accErr != nil || !hasAccess {
			return nil, apperr.Forbidden("BOARDROOM_ACCESS_DENIED", "Tidak memiliki akses", "")
		}
	}

	rows, err := s.q.ListCommentsByThread(ctx, pgtype.UUID{Bytes: threadID, Valid: true})
	if err != nil {
		return nil, apperr.Internal("Gagal memuat komentar: " + err.Error())
	}
	res := make([]CommentDTO, len(rows))
	for i, c := range rows {
		dto := CommentDTO{
			ID:               uuid.UUID(c.ID.Bytes).String(),
			ThreadID:         uuid.UUID(c.ThreadID.Bytes).String(),
			AuthorID:         uuid.UUID(c.AuthorID.Bytes).String(),
			AuthorName:       c.AuthorName,
			AuthorRole:       string(c.AuthorRole),
			Content:          c.Content,
			IsDeletedByAdmin: c.IsDeletedByAdmin,
			CreatedAt:        c.CreatedAt.Time,
		}
		if c.AdminDeleteReason.Valid {
			dto.AdminDeleteReason = &c.AdminDeleteReason.String
		}
		res[i] = dto
	}
	return res, nil
}

func (s *Service) PostToPublicHub(ctx context.Context, authorID uuid.UUID, title, content string, metricsJSON []byte) (*ThreadDTO, error) {
	return s.CreateHubThread(ctx, authorID, "discussion", title, content, metricsJSON)
}

func (s *Service) PostToBoardroom(ctx context.Context, smeID, authorID uuid.UUID, title, content string, aiReportID *uuid.UUID) (*ThreadDTO, error) {
	return s.CreateBoardroomThread(ctx, smeID, authorID, "discussion", title, content, aiReportID)
}

func mapPublicHubRowToDTO(r gen.ListPublicHubThreadsRow, hasVoted bool) ThreadDTO {
	dto := ThreadDTO{
		ID:                uuid.UUID(r.ID.Bytes).String(),
		AuthorID:          uuid.UUID(r.AuthorID.Bytes).String(),
		AuthorName:        r.AuthorName,
		AuthorRole:        string(r.AuthorRole),
		Visibility:        r.Visibility,
		Kind:              r.Kind,
		Title:             r.Title,
		Content:           r.Content,
		SharedMetricsJSON: string(r.SharedMetricsJson),
		UpvotesCount:      r.UpvotesCount,
		CommentCount:      r.CommentCount,
		HasVoted:          hasVoted,
		IsDeletedByAdmin:  r.IsDeletedByAdmin,
		CreatedAt:         r.CreatedAt.Time,
	}
	if r.AdminDeleteReason.Valid {
		dto.AdminDeleteReason = &r.AdminDeleteReason.String
	}
	if r.SmeID.Valid {
		idStr := uuid.UUID(r.SmeID.Bytes).String()
		dto.SMEID = &idStr
	}
	if r.AttachedAiReportID.Valid {
		idStr := uuid.UUID(r.AttachedAiReportID.Bytes).String()
		dto.AttachedAIReportID = &idStr
	}
	if r.GroupID.Valid {
		idStr := uuid.UUID(r.GroupID.Bytes).String()
		dto.GroupID = &idStr
	}
	if r.GroupName.Valid {
		dto.GroupName = &r.GroupName.String
	}
	if r.GroupSlug.Valid {
		dto.GroupSlug = &r.GroupSlug.String
	}
	return dto
}

func mapBoardroomRowToDTO(r gen.ListBoardroomThreadsRow, hasVoted bool) ThreadDTO {
	dto := ThreadDTO{
		ID:               uuid.UUID(r.ID.Bytes).String(),
		AuthorID:         uuid.UUID(r.AuthorID.Bytes).String(),
		AuthorName:       r.AuthorName,
		AuthorRole:       string(r.AuthorRole),
		Visibility:       r.Visibility,
		Kind:             r.Kind,
		Title:            r.Title,
		Content:          r.Content,
		UpvotesCount:     r.UpvotesCount,
		CommentCount:     r.CommentCount,
		HasVoted:         hasVoted,
		IsDeletedByAdmin: r.IsDeletedByAdmin,
		CreatedAt:        r.CreatedAt.Time,
	}
	if r.AdminDeleteReason.Valid {
		dto.AdminDeleteReason = &r.AdminDeleteReason.String
	}
	if r.SmeID.Valid {
		idStr := uuid.UUID(r.SmeID.Bytes).String()
		dto.SMEID = &idStr
	}
	if r.AttachedAiReportID.Valid {
		idStr := uuid.UUID(r.AttachedAiReportID.Bytes).String()
		dto.AttachedAIReportID = &idStr
	}
	return dto
}

func mapThreadRowToDTO(r gen.GetThreadByIDRow, hasVoted bool) *ThreadDTO {
	dto := &ThreadDTO{
		ID:                uuid.UUID(r.ID.Bytes).String(),
		AuthorID:          uuid.UUID(r.AuthorID.Bytes).String(),
		AuthorName:        r.AuthorName,
		AuthorRole:        string(r.AuthorRole),
		Visibility:        r.Visibility,
		Kind:              r.Kind,
		Title:             r.Title,
		Content:           r.Content,
		SharedMetricsJSON: string(r.SharedMetricsJson),
		UpvotesCount:      r.UpvotesCount,
		HasVoted:          hasVoted,
		IsDeletedByAdmin:  r.IsDeletedByAdmin,
		CreatedAt:         r.CreatedAt.Time,
	}
	if r.AdminDeleteReason.Valid {
		dto.AdminDeleteReason = &r.AdminDeleteReason.String
	}
	if r.SmeID.Valid {
		idStr := uuid.UUID(r.SmeID.Bytes).String()
		dto.SMEID = &idStr
	}
	if r.AttachedAiReportID.Valid {
		idStr := uuid.UUID(r.AttachedAiReportID.Bytes).String()
		dto.AttachedAIReportID = &idStr
	}
	if r.GroupID.Valid {
		idStr := uuid.UUID(r.GroupID.Bytes).String()
		dto.GroupID = &idStr
	}
	if r.GroupName.Valid {
		dto.GroupName = &r.GroupName.String
	}
	if r.GroupSlug.Valid {
		dto.GroupSlug = &r.GroupSlug.String
	}
	return dto
}
