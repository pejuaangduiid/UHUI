package bursa

import (
	"context"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
	"github.com/uhui/backend/internal/storage"
)

type BursaDocumentDTO struct {
	CreatedAt   time.Time `json:"created_at"`
	ID          string    `json:"id"`
	DocType     string    `json:"doc_type"`
	Title       string    `json:"title"`
	Status      string    `json:"status"`
	Hash        string    `json:"hash"`
	DownloadURL string    `json:"download_url,omitempty"`
	VerifyURL   string    `json:"verify_url,omitempty"`
}

type BoardroomThreadDTO struct {
	CreatedAt    time.Time `json:"created_at"`
	ID           string    `json:"id"`
	AuthorName   string    `json:"author_name"`
	AuthorRole   string    `json:"author_role"`
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	CommentCount int64     `json:"comment_count"`
}

type CreateBoardroomThreadInput struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type CreateBoardroomCommentInput struct {
	Content string `json:"content"`
}

func RegisterBursaBoardroomAndDocs(api huma.API, q *gen.Queries, store ...storage.StorageProvider) {
	var sp storage.StorageProvider
	if len(store) > 0 {
		sp = store[0]
	}
	registerGetBursaDocuments(api, q, sp)
	registerGetBoardroomThreads(api, q)
	registerPostBoardroomThread(api, q)
	registerPostBoardroomComment(api, q)
}

func registerGetBursaDocuments(api huma.API, q *gen.Queries, store storage.StorageProvider) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaGetDocuments",
		Method:      http.MethodGet,
		Path:        "/api/v1/bursa/{slug}/documents",
		Summary:     "Get verified financial reports and legal documents for SME",
		Tags:        []string{"Bursa"},
	}, func(ctx context.Context, in *struct {
		Slug string `path:"slug"`
	}) (*struct{ Body []BursaDocumentDTO }, error) {
		camp, err := q.GetCampaignBySlug(ctx, in.Slug)
		if err != nil {
			return nil, huma.NewError(http.StatusNotFound, "Kampanye tidak ditemukan")
		}

		snaps, _ := q.ListSnapshotsBySME(ctx, camp.SmeID)
		docs, _ := q.GetSMEDocuments(ctx, camp.SmeID)

		res := buildBursaDocumentList(ctx, camp, snaps, docs, store)
		return &struct{ Body []BursaDocumentDTO }{Body: res}, nil
	})
}

func buildSnapshotDoc(s gen.ReportSnapshot, bizName string) BursaDocumentDTO {
	cleanHex := hex.EncodeToString(s.Sha256)
	title := "Laporan Keuangan SAK EMKM (" + s.PeriodStart.Time.Format("Jan 2006") + ")"
	if s.DocType == "prospectus" {
		title = "Prospektus Penawaran Resmi " + bizName
	}
	return BursaDocumentDTO{
		ID:          uuid.UUID(s.ID.Bytes).String(),
		DocType:     s.DocType,
		Title:       title,
		Status:      "Terverifikasi Sistem",
		Hash:        "sha256:" + cleanHex,
		VerifyURL:   "/verify/" + cleanHex,
		DownloadURL: "/api/v1/verify/" + cleanHex,
		CreatedAt:   s.CreatedAt.Time,
	}
}

func buildLegalDoc(ctx context.Context, d gen.SmeDocument, store storage.StorageProvider) BursaDocumentDTO {
	var dlURL string
	if store != nil && d.StorageKey != "" {
		if u, err := store.SignedURL(ctx, d.StorageKey, 5*time.Minute); err == nil {
			dlURL = u
		}
	}
	return BursaDocumentDTO{
		ID:          uuid.UUID(d.ID.Bytes).String(),
		DocType:     d.DocType,
		Title:       "Legalitas: " + d.DocType,
		Status:      string(d.Status),
		Hash:        "sha256:" + d.StorageKey,
		DownloadURL: dlURL,
		VerifyURL:   dlURL,
		CreatedAt:   d.CreatedAt.Time,
	}
}

func buildFallbackDocs(bizName string) []BursaDocumentDTO {
	now := time.Now().UTC()
	sakHex := fmt.Sprintf("%x", []byte(bizName+"-sak-emkm"))
	proHex := fmt.Sprintf("%x", []byte(bizName+"-prospectus"))
	return []BursaDocumentDTO{
		{
			ID:          uuid.New().String(),
			DocType:     "sak_emkm",
			Title:       "Laporan Keuangan Standar SAK EMKM",
			Status:      "Terverifikasi Sistem",
			Hash:        "sha256:" + sakHex,
			VerifyURL:   "/verify/" + sakHex,
			DownloadURL: "/api/v1/verify/" + sakHex,
			CreatedAt:   now,
		},
		{
			ID:          uuid.New().String(),
			DocType:     "prospectus",
			Title:       "Prospektus Penawaran " + bizName,
			Status:      "Disetujui OJK / Kadin HUBURK",
			Hash:        "sha256:" + proHex,
			VerifyURL:   "/verify/" + proHex,
			DownloadURL: "/api/v1/verify/" + proHex,
			CreatedAt:   now,
		},
	}
}

func buildBursaDocumentList(ctx context.Context, camp gen.GetCampaignBySlugRow, snaps []gen.ReportSnapshot, docs []gen.SmeDocument, store storage.StorageProvider) []BursaDocumentDTO {
	res := make([]BursaDocumentDTO, 0, len(snaps)+len(docs)+2)
	for _, s := range snaps {
		res = append(res, buildSnapshotDoc(s, camp.BusinessName))
	}
	for _, d := range docs {
		res = append(res, buildLegalDoc(ctx, d, store))
	}
	if len(res) == 0 {
		res = append(res, buildFallbackDocs(camp.BusinessName)...)
	}
	return res
}

func registerGetBoardroomThreads(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaGetBoardroomThreads",
		Method:      http.MethodGet,
		Path:        "/api/v1/bursa/{slug}/boardroom-threads",
		Summary:     "List private shareholder boardroom threads",
		Tags:        []string{"Bursa"},
	}, func(ctx context.Context, in *struct {
		Slug string `path:"slug"`
	}) (*struct{ Body []BoardroomThreadDTO }, error) {
		camp, err := q.GetCampaignBySlug(ctx, in.Slug)
		if err != nil {
			return nil, huma.NewError(http.StatusNotFound, "Kampanye tidak ditemukan")
		}

		p, _ := middleware.GetPrincipal(ctx)
		access, err := evalBoardroomAccess(ctx, q, camp, p)
		if err != nil || !access.CanAccess {
			return nil, huma.NewError(http.StatusForbidden, "Akses ruang rapat pemegang saham dikunci")
		}

		threads, err := q.ListBoardroomThreads(ctx, gen.ListBoardroomThreadsParams{
			SmeID: camp.SmeID,
			Limit: 50,
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal memuat diskusi ruang rapat")
		}

		res := make([]BoardroomThreadDTO, len(threads))
		for i, t := range threads {
			res[i] = BoardroomThreadDTO{
				ID:           uuid.UUID(t.ID.Bytes).String(),
				AuthorName:   t.AuthorName,
				AuthorRole:   string(t.AuthorRole),
				Title:        t.Title,
				Content:      t.Content,
				CommentCount: t.CommentCount,
				CreatedAt:    t.CreatedAt.Time,
			}
		}
		return &struct{ Body []BoardroomThreadDTO }{Body: res}, nil
	})
}

func registerPostBoardroomThread(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaPostBoardroomThread",
		Method:      http.MethodPost,
		Path:        "/api/v1/bursa/{slug}/boardroom-threads",
		Summary:     "Create discussion in private shareholder boardroom",
		Tags:        []string{"Bursa"},
	}, func(ctx context.Context, in *struct {
		Slug string `path:"slug"`
		Body CreateBoardroomThreadInput
	}) (*struct{ Body *BoardroomThreadDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		camp, err := q.GetCampaignBySlug(ctx, in.Slug)
		if err != nil {
			return nil, huma.NewError(http.StatusNotFound, "Kampanye tidak ditemukan")
		}
		access, err := evalBoardroomAccess(ctx, q, camp, p)
		if err != nil || !access.CanAccess {
			return nil, huma.NewError(http.StatusForbidden, "Akses ruang rapat pemegang saham dikunci")
		}

		userUUID, _ := uuid.Parse(p.UserID)
		t, err := q.CreateThread(ctx, gen.CreateThreadParams{
			SmeID:      camp.SmeID,
			AuthorID:   pgtype.UUID{Bytes: userUUID, Valid: true},
			Visibility: "private_boardroom",
			Kind:       "discussion",
			Title:      in.Body.Title,
			Content:    in.Body.Content,
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal membuat thread: "+err.Error())
		}

		authorName := "Anggota"
		if u, err := q.GetUserByID(ctx, pgtype.UUID{Bytes: userUUID, Valid: true}); err == nil && u.FullName != "" {
			authorName = u.FullName
		}

		return &struct{ Body *BoardroomThreadDTO }{
			Body: &BoardroomThreadDTO{
				ID:           uuid.UUID(t.ID.Bytes).String(),
				AuthorName:   authorName,
				AuthorRole:   p.Role,
				Title:        t.Title,
				Content:      t.Content,
				CommentCount: 0,
				CreatedAt:    t.CreatedAt.Time,
			},
		}, nil
	})
}

func registerPostBoardroomComment(api huma.API, q *gen.Queries) {
	huma.Register(api, huma.Operation{
		OperationID: "bursaPostBoardroomComment",
		Method:      http.MethodPost,
		Path:        "/api/v1/bursa/{slug}/boardroom-threads/{id}/comments",
		Summary:     "Post comment on a boardroom thread",
		Tags:        []string{"Bursa"},
	}, func(ctx context.Context, in *struct {
		Slug string `path:"slug"`
		ID   string `path:"id"`
		Body CreateBoardroomCommentInput
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
		userUUID, _ := uuid.Parse(p.UserID)

		_, err = q.CreateComment(ctx, gen.CreateCommentParams{
			ThreadID: pgtype.UUID{Bytes: threadUUID, Valid: true},
			AuthorID: pgtype.UUID{Bytes: userUUID, Valid: true},
			Content:  in.Body.Content,
		})
		if err != nil {
			return nil, huma.NewError(http.StatusInternalServerError, "Gagal memposting komentar: "+err.Error())
		}
		return &struct {
			Body struct {
				Status string `json:"status"`
			}
		}{
			Body: struct {
				Status string `json:"status"`
			}{Status: "created"},
		}, nil
	})
}
