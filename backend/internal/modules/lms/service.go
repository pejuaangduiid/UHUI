package lms

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/payment"
)

type Service struct {
	q   *gen.Queries
	pay payment.PaymentProvider
}

func NewService(q *gen.Queries, pay ...payment.PaymentProvider) *Service {
	var p payment.PaymentProvider
	if len(pay) > 0 {
		p = pay[0]
	}
	return &Service{q: q, pay: p}
}

func (s *Service) ListCourses(ctx context.Context, userID *uuid.UUID) ([]CourseDTO, error) {
	rows, err := s.q.ListCourses(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat katalog kursus: " + err.Error())
	}

	result := make([]CourseDTO, len(rows))
	for i, r := range rows {
		isEnrolled := false
		if userID != nil {
			enroll, _ := s.q.GetCourseEnrollment(ctx, gen.GetCourseEnrollmentParams{
				CourseID: r.ID,
				UserID:   pgtype.UUID{Bytes: *userID, Valid: true},
			})
			if enroll.ID.Valid {
				isEnrolled = true
			}
		}

		var thumb *string
		if r.ThumbnailUrl.Valid {
			thumb = &r.ThumbnailUrl.String
		}

		result[i] = CourseDTO{
			ID:             uuid.UUID(r.ID.Bytes).String(),
			Slug:           r.Slug,
			Title:          r.Title,
			Description:    r.Description,
			InstructorName: r.InstructorName,
			PriceIDR:       r.PriceIdr,
			ThumbnailURL:   thumb,
			Level:          r.Level,
			LessonCount:    r.LessonCount,
			StudentCount:   r.StudentCount,
			IsEnrolled:     isEnrolled,
			CreatedAt:      r.CreatedAt.Time,
		}
	}
	return result, nil
}

func (s *Service) GetCourseBySlug(ctx context.Context, slug string, userID *uuid.UUID) (*CourseDetailDTO, error) {
	c, err := s.q.GetCourseBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("COURSE_NOT_FOUND", "Kursus tidak ditemukan", "")
		}
		return nil, apperr.Internal("Gagal mengambil detail kursus: " + err.Error())
	}

	lessons, err := s.q.ListLessonsByCourseID(ctx, c.ID)
	if err != nil {
		return nil, apperr.Internal("Gagal mengambil materi kursus: " + err.Error())
	}

	isEnrolled, progress := s.checkEnrollment(ctx, c.ID, userID)

	var thumb *string
	if c.ThumbnailUrl.Valid {
		thumb = &c.ThumbnailUrl.String
	}

	return &CourseDetailDTO{
		CourseDTO: CourseDTO{
			ID:             uuid.UUID(c.ID.Bytes).String(),
			Slug:           c.Slug,
			Title:          c.Title,
			Description:    c.Description,
			InstructorName: c.InstructorName,
			PriceIDR:       c.PriceIdr,
			ThumbnailURL:   thumb,
			Level:          c.Level,
			LessonCount:    c.LessonCount,
			StudentCount:   c.StudentCount,
			IsEnrolled:     isEnrolled,
			CreatedAt:      c.CreatedAt.Time,
		},
		Lessons:  buildLessonDTOs(lessons),
		Progress: progress,
	}, nil
}

func (s *Service) checkEnrollment(ctx context.Context, courseID pgtype.UUID, userID *uuid.UUID) (bool, int32) {
	if userID == nil {
		return false, 0
	}
	enroll, err := s.q.GetCourseEnrollment(ctx, gen.GetCourseEnrollmentParams{
		CourseID: courseID,
		UserID:   pgtype.UUID{Bytes: *userID, Valid: true},
	})
	if err == nil && enroll.ID.Valid {
		return true, enroll.ProgressPercent
	}
	return false, 0
}

func buildLessonDTOs(lessons []gen.CourseLesson) []LessonDTO {
	res := make([]LessonDTO, len(lessons))
	for i, l := range lessons {
		var vid, content *string
		if l.VideoUrl.Valid {
			vid = &l.VideoUrl.String
		}
		if l.ContentText.Valid {
			content = &l.ContentText.String
		}
		res[i] = LessonDTO{
			ID:              uuid.UUID(l.ID.Bytes).String(),
			CourseID:        uuid.UUID(l.CourseID.Bytes).String(),
			SortOrder:       l.SortOrder,
			Title:           l.Title,
			DurationMinutes: l.DurationMinutes,
			VideoURL:        vid,
			ContentText:     content,
		}
	}
	return res
}

func (s *Service) Enroll(ctx context.Context, courseID, userID uuid.UUID) (*EnrollCourseResponse, error) {
	c, err := s.q.GetCourseByID(ctx, pgtype.UUID{Bytes: courseID, Valid: true})
	if err != nil {
		return nil, apperr.NotFound("COURSE_NOT_FOUND", "Kursus tidak ditemukan", "")
	}

	existing, _ := s.q.GetCourseEnrollment(ctx, gen.GetCourseEnrollmentParams{
		CourseID: c.ID,
		UserID:   pgtype.UUID{Bytes: userID, Valid: true},
	})
	if existing.ID.Valid {
		return &EnrollCourseResponse{
			EnrollmentID: uuid.UUID(existing.ID.Bytes).String(),
			CourseID:     courseID.String(),
			AmountPaid:   existing.AmountPaidIdr,
			EnrolledAt:   existing.CreatedAt.Time,
			Status:       "already_enrolled",
		}, nil
	}

	if c.PriceIdr > 0 && s.pay != nil {
		var chargeErr error
		_, chargeErr = s.pay.Charge(ctx, payment.ChargeRequest{
			InvestorID:     userID.String(),
			AmountIDR:      c.PriceIdr,
			IdempotencyKey: fmt.Sprintf("ENROLL-%s-%s", courseID.String(), userID.String()),
		})
		if chargeErr != nil {
			return nil, apperr.BadRequest("INSUFFICIENT_BALANCE", "Gagal membeli kursus: "+chargeErr.Error(), "Silakan isi ulang saldo akun Anda")
		}
	}

	enroll, err := s.q.CreateCourseEnrollment(ctx, gen.CreateCourseEnrollmentParams{
		CourseID:        c.ID,
		UserID:          pgtype.UUID{Bytes: userID, Valid: true},
		AmountPaidIdr:   c.PriceIdr,
		ProgressPercent: 0,
	})
	if err != nil {
		return nil, apperr.Internal("Gagal mendaftar kursus: " + err.Error())
	}

	return &EnrollCourseResponse{
		EnrollmentID: uuid.UUID(enroll.ID.Bytes).String(),
		CourseID:     courseID.String(),
		AmountPaid:   enroll.AmountPaidIdr,
		EnrolledAt:   enroll.CreatedAt.Time,
		Status:       "enrolled",
	}, nil
}

func (s *Service) ListWebinars(ctx context.Context, userID *uuid.UUID) ([]WebinarDTO, error) {
	rows, err := s.q.ListWebinars(ctx)
	if err != nil {
		return nil, apperr.Internal("Gagal memuat jadwal webinar: " + err.Error())
	}

	result := make([]WebinarDTO, len(rows))
	for i, r := range rows {
		isReg := false
		if userID != nil {
			isReg, _ = s.q.HasWebinarRegistration(ctx, gen.HasWebinarRegistrationParams{
				WebinarID: r.ID,
				UserID:    pgtype.UUID{Bytes: *userID, Valid: true},
			})
		}

		var banner, stream, relTitle, relSlug *string
		if r.BannerUrl.Valid {
			banner = &r.BannerUrl.String
		}
		if r.StreamUrl.Valid {
			stream = &r.StreamUrl.String
		}
		if r.RelatedCourseTitle.Valid {
			relTitle = &r.RelatedCourseTitle.String
		}
		if r.RelatedCourseSlug.Valid {
			relSlug = &r.RelatedCourseSlug.String
		}

		result[i] = WebinarDTO{
			ID:                 uuid.UUID(r.ID.Bytes).String(),
			Slug:               r.Slug,
			Title:              r.Title,
			SpeakerName:        r.SpeakerName,
			SpeakerRole:        r.SpeakerRole,
			ScheduledAt:        r.ScheduledAt.Time,
			BannerURL:          banner,
			StreamURL:          stream,
			RelatedCourseTitle: relTitle,
			RelatedCourseSlug:  relSlug,
			IsFree:             r.IsFree,
			RegistrationCount:  r.RegistrationCount,
			IsRegistered:       isReg,
			CreatedAt:          r.CreatedAt.Time,
		}
	}
	return result, nil
}

func (s *Service) RegisterWebinar(ctx context.Context, webinarID, userID uuid.UUID) error {
	w, err := s.q.GetWebinarByID(ctx, pgtype.UUID{Bytes: webinarID, Valid: true})
	if err != nil {
		return apperr.NotFound("WEBINAR_NOT_FOUND", "Webinar tidak ditemukan", "")
	}

	already, _ := s.q.HasWebinarRegistration(ctx, gen.HasWebinarRegistrationParams{
		WebinarID: w.ID,
		UserID:    pgtype.UUID{Bytes: userID, Valid: true},
	})
	if already {
		return nil
	}

	_, err = s.q.CreateWebinarRegistration(ctx, gen.CreateWebinarRegistrationParams{
		WebinarID: w.ID,
		UserID:    pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return apperr.Internal("Gagal mendaftar webinar: " + err.Error())
	}
	return nil
}
