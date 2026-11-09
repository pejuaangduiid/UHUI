package lms

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/middleware"
)

var (
	lmsCacheLock  sync.RWMutex
	coursesCache  []CourseDTO
	coursesExp    time.Time
	webinarsCache []WebinarDTO
	webinarsExp   time.Time
)

func RegisterHandlers(api huma.API, svc *Service) {
	registerListCourses(api, svc)
	registerGetCourseBySlug(api, svc)
	registerEnrollCourse(api, svc)
	registerListWebinars(api, svc)
	registerRegisterWebinar(api, svc)
}

func registerListCourses(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "lmsListCourses",
		Method:      http.MethodGet,
		Path:        "/api/v1/courses",
		Summary:     "List published LMS courses",
		Tags:        []string{"LMS"},
	}, func(ctx context.Context, in *struct{}) (*struct{ Body []CourseDTO }, error) {
		var uID *uuid.UUID
		if p, ok := middleware.GetPrincipal(ctx); ok && p != nil {
			if id, err := uuid.Parse(p.UserID); err == nil {
				uID = &id
			}
		}
		if uID == nil {
			lmsCacheLock.RLock()
			if time.Now().Before(coursesExp) && coursesCache != nil {
				cached := coursesCache
				lmsCacheLock.RUnlock()
				return &struct{ Body []CourseDTO }{Body: cached}, nil
			}
			lmsCacheLock.RUnlock()
		}
		items, err := svc.ListCourses(ctx, uID)
		if err != nil {
			return nil, mapAppError(err)
		}
		if uID == nil {
			lmsCacheLock.Lock()
			coursesCache = items
			coursesExp = time.Now().Add(60 * time.Second)
			lmsCacheLock.Unlock()
		}
		return &struct{ Body []CourseDTO }{Body: items}, nil
	})
}

func registerGetCourseBySlug(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "lmsGetCourseBySlug",
		Method:      http.MethodGet,
		Path:        "/api/v1/courses/{slug}",
		Summary:     "Get course details, lessons, and enrollment status",
		Tags:        []string{"LMS"},
	}, func(ctx context.Context, in *struct {
		Slug string `path:"slug"`
	}) (*struct{ Body *CourseDetailDTO }, error) {
		var uID *uuid.UUID
		if p, ok := middleware.GetPrincipal(ctx); ok && p != nil {
			if id, err := uuid.Parse(p.UserID); err == nil {
				uID = &id
			}
		}
		item, err := svc.GetCourseBySlug(ctx, in.Slug, uID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *CourseDetailDTO }{Body: item}, nil
	})
}

func registerEnrollCourse(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "lmsEnrollCourse",
		Method:      http.MethodPost,
		Path:        "/api/v1/courses/{id}/enroll",
		Summary:     "Enroll in a course with simulated payment",
		Tags:        []string{"LMS"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct{ Body *EnrollCourseResponse }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		courseUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid course id")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		res, err := svc.Enroll(ctx, courseUUID, userUUID)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *EnrollCourseResponse }{Body: res}, nil
	})
}

func registerListWebinars(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "lmsListWebinars",
		Method:      http.MethodGet,
		Path:        "/api/v1/webinars",
		Summary:     "List free and promotional webinars",
		Tags:        []string{"LMS"},
	}, func(ctx context.Context, in *struct{}) (*struct{ Body []WebinarDTO }, error) {
		var uID *uuid.UUID
		if p, ok := middleware.GetPrincipal(ctx); ok && p != nil {
			if id, err := uuid.Parse(p.UserID); err == nil {
				uID = &id
			}
		}
		if uID == nil {
			lmsCacheLock.RLock()
			if time.Now().Before(webinarsExp) && webinarsCache != nil {
				cached := webinarsCache
				lmsCacheLock.RUnlock()
				return &struct{ Body []WebinarDTO }{Body: cached}, nil
			}
			lmsCacheLock.RUnlock()
		}
		items, err := svc.ListWebinars(ctx, uID)
		if err != nil {
			return nil, mapAppError(err)
		}
		if uID == nil {
			lmsCacheLock.Lock()
			webinarsCache = items
			webinarsExp = time.Now().Add(60 * time.Second)
			lmsCacheLock.Unlock()
		}
		return &struct{ Body []WebinarDTO }{Body: items}, nil
	})
}

func registerRegisterWebinar(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "lmsRegisterWebinar",
		Method:      http.MethodPost,
		Path:        "/api/v1/webinars/{id}/register",
		Summary:     "Register for a webinar",
		Tags:        []string{"LMS"},
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
		webinarUUID, err := uuid.Parse(in.ID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid webinar id")
		}
		userUUID, err := uuid.Parse(p.UserID)
		if err != nil {
			return nil, huma.NewError(http.StatusBadRequest, "Invalid user id")
		}

		if err := svc.RegisterWebinar(ctx, webinarUUID, userUUID); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Status string `json:"status"`
			}
		}{
			Body: struct {
				Status string `json:"status"`
			}{Status: "registered"},
		}, nil
	})
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
