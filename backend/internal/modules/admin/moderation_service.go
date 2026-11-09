package admin

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
)

func (s *Service) GetStats(ctx context.Context) (*StatsDTO, error) {
	q := gen.New(s.pool)
	row, err := q.GetAdminStats(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat statistik admin: " + err.Error())
	}
	return &StatsDTO{
		TotalSMEs:          row.TotalSmes,
		SuspendedSMEs:      row.SuspendedSmes,
		TotalCampaigns:     row.TotalCampaigns,
		SuspendedCampaigns: row.SuspendedCampaigns,
		TotalCourses:       row.TotalCourses,
		TotalThreads:       row.TotalThreads,
		ModeratedThreads:   row.ModeratedThreads,
		SuspendedUsers:     row.SuspendedUsers,
	}, nil
}

func (s *Service) ListAllSMEs(ctx context.Context) ([]SMEAdminDTO, error) {
	q := gen.New(s.pool)
	rows, err := q.ListAllSMEsForAdmin(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat daftar UMKM: " + err.Error())
	}
	res := make([]SMEAdminDTO, len(rows))
	for i, r := range rows {
		dto := SMEAdminDTO{
			ID:               uuidToString(r.ID),
			OwnerID:          uuidToString(r.OwnerID),
			OwnerName:        r.OwnerName,
			OwnerEmail:       r.OwnerEmail,
			BusinessName:     r.BusinessName,
			Slug:             r.Slug,
			Sector:           r.Sector,
			Description:      r.Description,
			IsIncorporatedPT: r.IsIncorporatedPt,
			IsListedOnBursa:  r.IsListedOnBursa,
			IsSuspended:      r.IsSuspended,
			CreatedAt:        r.CreatedAt.Time,
		}
		if r.DigitalReadinessScore.Valid {
			dto.DigitalReadinessScore = &r.DigitalReadinessScore.Int16
		}
		if r.SuspensionReason.Valid {
			dto.SuspensionReason = &r.SuspensionReason.String
		}
		res[i] = dto
	}
	return res, nil
}

func (s *Service) SetSMESuspension(ctx context.Context, smeID pgtype.UUID, isSuspended bool, reason string) error {
	q := gen.New(s.pool)
	var reasonText pgtype.Text
	if isSuspended && strings.TrimSpace(reason) != "" {
		_ = reasonText.Scan(strings.TrimSpace(reason))
	}
	_, err := q.SetSMESuspension(ctx, gen.SetSMESuspensionParams{
		ID:               smeID,
		IsSuspended:      isSuspended,
		SuspensionReason: reasonText,
	})
	if err != nil {
		return apperr.Internal("Gagal memperbarui status penangguhan UMKM: " + err.Error())
	}
	return nil
}

func (s *Service) ListAllCampaigns(ctx context.Context) ([]CampaignAdminDTO, error) {
	q := gen.New(s.pool)
	rows, err := q.ListAllCampaignsForAdmin(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat daftar kampanye bursa: " + err.Error())
	}
	res := make([]CampaignAdminDTO, len(rows))
	for i, r := range rows {
		dto := CampaignAdminDTO{
			ID:               uuidToString(r.ID),
			SMEID:            uuidToString(r.SmeID),
			BusinessName:     r.BusinessName,
			Sector:           r.Sector,
			OwnerName:        r.OwnerName,
			OwnerEmail:       r.OwnerEmail,
			Slug:             r.Slug,
			Title:            r.Title,
			Scheme:           string(r.Scheme),
			TargetAmountIDR:  r.TargetAmountIdr,
			RaisedAmountIDR:  r.RaisedAmountIdr,
			MinInvestmentIDR: r.MinInvestmentIdr,
			ReturnShareBps:   r.ReturnShareBps,
			TermMonths:       r.TermMonths,
			Status:           string(r.Status),
			IsSuspended:      r.IsSuspended,
			ClosesAt:         r.ClosesAt.Time,
			CreatedAt:        r.CreatedAt.Time,
		}
		if r.SuspensionReason.Valid {
			dto.SuspensionReason = &r.SuspensionReason.String
		}
		res[i] = dto
	}
	return res, nil
}

func (s *Service) SetCampaignSuspension(ctx context.Context, campID pgtype.UUID, isSuspended bool, reason string) error {
	q := gen.New(s.pool)
	var reasonText pgtype.Text
	if isSuspended && strings.TrimSpace(reason) != "" {
		_ = reasonText.Scan(strings.TrimSpace(reason))
	}
	_, err := q.SetCampaignSuspension(ctx, gen.SetCampaignSuspensionParams{
		ID:               campID,
		IsSuspended:      isSuspended,
		SuspensionReason: reasonText,
	})
	if err != nil {
		return apperr.Internal("Gagal memperbarui status penangguhan kampanye: " + err.Error())
	}
	return nil
}

func (s *Service) ListAllCourses(ctx context.Context) ([]CourseAdminDTO, error) {
	q := gen.New(s.pool)
	rows, err := q.ListAllCoursesForAdmin(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat kursus: " + err.Error())
	}
	res := make([]CourseAdminDTO, len(rows))
	for i, r := range rows {
		dto := CourseAdminDTO{
			ID:             uuidToString(r.ID),
			Slug:           r.Slug,
			Title:          r.Title,
			Description:    r.Description,
			InstructorName: r.InstructorName,
			PriceIDR:       r.PriceIdr,
			Level:          r.Level,
			IsPublished:    r.IsPublished,
			LessonCount:    r.LessonCount,
			StudentCount:   r.StudentCount,
			CreatedAt:      r.CreatedAt.Time,
		}
		if r.ThumbnailUrl.Valid {
			dto.ThumbnailURL = &r.ThumbnailUrl.String
		}
		res[i] = dto
	}
	return res, nil
}

func (s *Service) CreateCourse(ctx context.Context, in CreateCourseInput) (*CourseAdminDTO, error) {
	if strings.TrimSpace(in.Title) == "" || strings.TrimSpace(in.Slug) == "" {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Judul dan slug kursus wajib diisi", "")
	}
	level := strings.ToLower(strings.TrimSpace(in.Level))
	if level != "pemula" && level != "menengah" && level != "lanjutan" {
		level = "pemula"
	}
	var thumbText pgtype.Text
	if in.ThumbnailURL != "" {
		_ = thumbText.Scan(in.ThumbnailURL)
	}

	q := gen.New(s.pool)
	c, err := q.CreateCourseAdmin(ctx, gen.CreateCourseAdminParams{
		Slug:           in.Slug,
		Title:          in.Title,
		Description:    in.Description,
		InstructorName: in.InstructorName,
		PriceIdr:       in.PriceIDR,
		Level:          level,
		IsPublished:    in.IsPublished,
		ThumbnailUrl:   thumbText,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal membuat kursus: " + err.Error())
	}
	dto := &CourseAdminDTO{
		ID:             uuidToString(c.ID),
		Slug:           c.Slug,
		Title:          c.Title,
		Description:    c.Description,
		InstructorName: c.InstructorName,
		PriceIDR:       c.PriceIdr,
		Level:          c.Level,
		IsPublished:    c.IsPublished,
		CreatedAt:      c.CreatedAt.Time,
	}
	if c.ThumbnailUrl.Valid {
		dto.ThumbnailURL = &c.ThumbnailUrl.String
	}
	return dto, nil
}

func (s *Service) UpdateCourse(ctx context.Context, id pgtype.UUID, in UpdateCourseInput) (*CourseAdminDTO, error) {
	level := strings.ToLower(strings.TrimSpace(in.Level))
	if level != "pemula" && level != "menengah" && level != "lanjutan" {
		level = "pemula"
	}
	var thumbText pgtype.Text
	if in.ThumbnailURL != "" {
		_ = thumbText.Scan(in.ThumbnailURL)
	}

	q := gen.New(s.pool)
	c, err := q.UpdateCourseAdmin(ctx, gen.UpdateCourseAdminParams{
		ID:             id,
		Title:          in.Title,
		Description:    in.Description,
		InstructorName: in.InstructorName,
		PriceIdr:       in.PriceIDR,
		Level:          level,
		IsPublished:    in.IsPublished,
		ThumbnailUrl:   thumbText,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal memperbarui kursus: " + err.Error())
	}
	dto := &CourseAdminDTO{
		ID:             uuidToString(c.ID),
		Slug:           c.Slug,
		Title:          c.Title,
		Description:    c.Description,
		InstructorName: c.InstructorName,
		PriceIDR:       c.PriceIdr,
		Level:          c.Level,
		IsPublished:    c.IsPublished,
		CreatedAt:      c.CreatedAt.Time,
	}
	if c.ThumbnailUrl.Valid {
		dto.ThumbnailURL = &c.ThumbnailUrl.String
	}
	return dto, nil
}

func (s *Service) DeleteCourse(ctx context.Context, id pgtype.UUID) error {
	q := gen.New(s.pool)
	if err := q.DeleteCourseAdmin(ctx, id); err != nil {
		return apperr.Internal("Gagal menghapus kursus: " + err.Error())
	}
	return nil
}

func (s *Service) ListLessons(ctx context.Context, courseID pgtype.UUID) ([]LessonAdminDTO, error) {
	q := gen.New(s.pool)
	rows, err := q.ListLessonsByCourseID(ctx, courseID)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat modul pelajaran: " + err.Error())
	}
	res := make([]LessonAdminDTO, len(rows))
	for i, r := range rows {
		dto := LessonAdminDTO{
			ID:              uuidToString(r.ID),
			CourseID:        uuidToString(r.CourseID),
			SortOrder:       r.SortOrder,
			Title:           r.Title,
			DurationMinutes: r.DurationMinutes,
			CreatedAt:       r.CreatedAt.Time,
		}
		if r.VideoUrl.Valid {
			dto.VideoURL = &r.VideoUrl.String
		}
		if r.ContentText.Valid {
			dto.ContentText = &r.ContentText.String
		}
		res[i] = dto
	}
	return res, nil
}

func (s *Service) CreateLesson(ctx context.Context, courseID pgtype.UUID, in CreateLessonInput) (*LessonAdminDTO, error) {
	if strings.TrimSpace(in.Title) == "" {
		return nil, apperr.BadRequest(apperr.CodeBadRequest, "Judul modul wajib diisi", "")
	}
	var vidText, contentText pgtype.Text
	if in.VideoURL != "" {
		_ = vidText.Scan(in.VideoURL)
	}
	if in.ContentText != "" {
		_ = contentText.Scan(in.ContentText)
	}
	dur := in.DurationMinutes
	if dur <= 0 {
		dur = 15
	}
	sort := in.SortOrder
	if sort <= 0 {
		sort = 1
	}

	q := gen.New(s.pool)
	l, err := q.CreateLessonAdmin(ctx, gen.CreateLessonAdminParams{
		CourseID:        courseID,
		SortOrder:       sort,
		Title:           in.Title,
		DurationMinutes: dur,
		VideoUrl:        vidText,
		ContentText:     contentText,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal menambahkan modul: " + err.Error())
	}
	dto := &LessonAdminDTO{
		ID:              uuidToString(l.ID),
		CourseID:        uuidToString(l.CourseID),
		SortOrder:       l.SortOrder,
		Title:           l.Title,
		DurationMinutes: l.DurationMinutes,
		CreatedAt:       l.CreatedAt.Time,
	}
	if l.VideoUrl.Valid {
		dto.VideoURL = &l.VideoUrl.String
	}
	if l.ContentText.Valid {
		dto.ContentText = &l.ContentText.String
	}
	return dto, nil
}

func (s *Service) UpdateLesson(ctx context.Context, id pgtype.UUID, in UpdateLessonInput) (*LessonAdminDTO, error) {
	var vidText, contentText pgtype.Text
	if in.VideoURL != "" {
		_ = vidText.Scan(in.VideoURL)
	}
	if in.ContentText != "" {
		_ = contentText.Scan(in.ContentText)
	}
	dur := in.DurationMinutes
	if dur <= 0 {
		dur = 15
	}
	sort := in.SortOrder
	if sort <= 0 {
		sort = 1
	}

	q := gen.New(s.pool)
	l, err := q.UpdateLessonAdmin(ctx, gen.UpdateLessonAdminParams{
		ID:              id,
		Title:           in.Title,
		DurationMinutes: dur,
		ContentText:     contentText,
		SortOrder:       sort,
		VideoUrl:        vidText,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal memperbarui modul: " + err.Error())
	}
	dto := &LessonAdminDTO{
		ID:              uuidToString(l.ID),
		CourseID:        uuidToString(l.CourseID),
		SortOrder:       l.SortOrder,
		Title:           l.Title,
		DurationMinutes: l.DurationMinutes,
		CreatedAt:       l.CreatedAt.Time,
	}
	if l.VideoUrl.Valid {
		dto.VideoURL = &l.VideoUrl.String
	}
	if l.ContentText.Valid {
		dto.ContentText = &l.ContentText.String
	}
	return dto, nil
}

func (s *Service) DeleteLesson(ctx context.Context, id pgtype.UUID) error {
	q := gen.New(s.pool)
	if err := q.DeleteLessonAdmin(ctx, id); err != nil {
		return apperr.Internal("Gagal menghapus modul: " + err.Error())
	}
	return nil
}

func (s *Service) ListThreadsForModeration(ctx context.Context, limit int32) ([]ThreadModerationDTO, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	q := gen.New(s.pool)
	rows, err := q.ListAllThreadsForAdmin(ctx, limit)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat threads untuk moderasi: " + err.Error())
	}
	res := make([]ThreadModerationDTO, len(rows))
	for i, r := range rows {
		dto := ThreadModerationDTO{
			ID:               uuidToString(r.ID),
			AuthorID:         uuidToString(r.AuthorID),
			AuthorName:       r.AuthorName,
			AuthorEmail:      r.AuthorEmail,
			AuthorRole:       string(r.AuthorRole),
			Visibility:       r.Visibility,
			Kind:             r.Kind,
			Title:            r.Title,
			Content:          r.Content,
			UpvotesCount:     r.UpvotesCount,
			CommentCount:     r.CommentCount,
			IsDeletedByAdmin: r.IsDeletedByAdmin,
			CreatedAt:        r.CreatedAt.Time,
		}
		if r.AuthorSuspendedUntil.Valid {
			dto.AuthorSuspendedUntil = &r.AuthorSuspendedUntil.Time
		}
		if r.GroupID.Valid {
			gid := uuidToString(r.GroupID)
			dto.GroupID = &gid
		}
		if r.GroupName.Valid {
			dto.GroupName = &r.GroupName.String
		}
		if r.GroupSlug.Valid {
			dto.GroupSlug = &r.GroupSlug.String
		}
		if r.AdminDeleteReason.Valid {
			dto.AdminDeleteReason = &r.AdminDeleteReason.String
		}
		res[i] = dto
	}
	return res, nil
}

func (s *Service) ModerateDeleteThread(ctx context.Context, threadID pgtype.UUID, reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		reason = "Melanggar panduan komunitas UHUI"
	}
	var reasonText pgtype.Text
	_ = reasonText.Scan(reason)

	q := gen.New(s.pool)
	_, err := q.AdminDeleteThread(ctx, gen.AdminDeleteThreadParams{
		ID:                threadID,
		AdminDeleteReason: reasonText,
	})
	if err != nil {
		return apperr.Internal("Gagal menghapus thread: " + err.Error())
	}
	return nil
}

func (s *Service) ModerateDeleteComment(ctx context.Context, commentID pgtype.UUID, reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		reason = "Melanggar panduan komunitas UHUI"
	}
	var reasonText pgtype.Text
	_ = reasonText.Scan(reason)

	q := gen.New(s.pool)
	_, err := q.AdminDeleteComment(ctx, gen.AdminDeleteCommentParams{
		ID:                commentID,
		AdminDeleteReason: reasonText,
	})
	if err != nil {
		return apperr.Internal("Gagal menghapus komentar: " + err.Error())
	}
	return nil
}

func (s *Service) SuspendUser(ctx context.Context, userID pgtype.UUID, in SuspendUserInput) (*SuspendedUserDTO, error) {
	hours := in.DurationHours
	if hours <= 0 {
		hours = 24
	}
	reason := strings.TrimSpace(in.Reason)
	if reason == "" {
		reason = "Pelanggaran tata tertib komunitas"
	}

	until := time.Now().Add(time.Duration(hours) * time.Hour)
	var untilTz pgtype.Timestamptz
	_ = untilTz.Scan(until)

	var reasonText pgtype.Text
	_ = reasonText.Scan(reason)

	q := gen.New(s.pool)
	u, err := q.SuspendUser(ctx, gen.SuspendUserParams{
		ID:               userID,
		SuspendedUntil:   untilTz,
		SuspensionReason: reasonText,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal menangguhkan pengguna: " + err.Error())
	}

	dto := &SuspendedUserDTO{
		ID:             uuidToString(u.ID),
		Email:          u.Email,
		FullName:       u.FullName,
		Role:           string(u.Role),
		SuspendedUntil: u.SuspendedUntil.Time,
		CreatedAt:      time.Now(),
	}
	if u.SuspensionReason.Valid {
		dto.SuspensionReason = &u.SuspensionReason.String
	}
	return dto, nil
}

func (s *Service) UnsuspendUser(ctx context.Context, userID pgtype.UUID) error {
	q := gen.New(s.pool)
	_, err := q.UnsuspendUser(ctx, userID)
	if err != nil {
		return apperr.Internal("Gagal membatalkan penangguhan pengguna: " + err.Error())
	}
	return nil
}

func (s *Service) ListSuspendedUsers(ctx context.Context) ([]SuspendedUserDTO, error) {
	q := gen.New(s.pool)
	rows, err := q.ListSuspendedUsers(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat pengguna yang ditangguhkan: " + err.Error())
	}
	res := make([]SuspendedUserDTO, len(rows))
	for i, r := range rows {
		dto := SuspendedUserDTO{
			ID:             uuidToString(r.ID),
			Email:          r.Email,
			FullName:       r.FullName,
			Role:           string(r.Role),
			SuspendedUntil: r.SuspendedUntil.Time,
			CreatedAt:      r.CreatedAt.Time,
		}
		if r.SuspensionReason.Valid {
			dto.SuspensionReason = &r.SuspensionReason.String
		}
		res[i] = dto
	}
	return res, nil
}
