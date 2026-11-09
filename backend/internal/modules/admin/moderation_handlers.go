package admin

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/middleware"
)

func RegisterModerationHandlers(api huma.API, svc *Service) {
	registerAdminStats(api, svc)
	registerAdminSMEs(api, svc)
	registerAdminSetSMESuspension(api, svc)
	registerAdminCampaigns(api, svc)
	registerAdminSetCampaignSuspension(api, svc)
	registerAdminListCourses(api, svc)
	registerAdminCreateCourse(api, svc)
	registerAdminUpdateCourse(api, svc)
	registerAdminDeleteCourse(api, svc)
	registerAdminLessonOps(api, svc)
	registerAdminListThreads(api, svc)
	registerAdminModerateDeleteThread(api, svc)
	registerAdminModerateDeleteComment(api, svc)
	registerAdminSuspendUser(api, svc)
	registerAdminUnsuspendUser(api, svc)
	registerAdminListSuspendedUsers(api, svc)
}

func registerAdminStats(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminGetStats",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/stats",
		Summary:     "Get general metrics and moderation counts for superadmin",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body *StatsDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin", "analyst"); err != nil {
			return nil, mapAppError(err)
		}
		stats, err := svc.GetStats(ctx)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *StatsDTO }{Body: stats}, nil
	})
}

func registerAdminSMEs(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminListSMEs",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/smes",
		Summary:     "List all registered SMEs with suspension status",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []SMEAdminDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin", "analyst"); err != nil {
			return nil, mapAppError(err)
		}
		items, err := svc.ListAllSMEs(ctx)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []SMEAdminDTO }{Body: items}, nil
	})
}

func registerAdminSetSMESuspension(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminSetSMESuspension",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/smes/{id}/suspend",
		Summary:     "Suspend or unsuspend an SME business",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string       `path:"id"`
		Body SuspendInput `json:"body"`
	}) (*struct {
		Body struct {
			Success bool `json:"success"`
		}
	}, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID UMKM tidak valid", "")
		}
		if err := svc.SetSMESuspension(ctx, id, in.Body.IsSuspended, in.Body.Reason); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Success bool `json:"success"`
			}
		}{Body: struct {
			Success bool `json:"success"`
		}{Success: true}}, nil
	})
}

func registerAdminCampaigns(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminListAllCampaigns",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/campaigns",
		Summary:     "List all bursa campaigns with suspension status",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []CampaignAdminDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin", "analyst"); err != nil {
			return nil, mapAppError(err)
		}
		items, err := svc.ListAllCampaigns(ctx)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []CampaignAdminDTO }{Body: items}, nil
	})
}

func registerAdminSetCampaignSuspension(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminSetCampaignSuspension",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/campaigns/{id}/suspend",
		Summary:     "Suspend or unsuspend a bursa campaign",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string       `path:"id"`
		Body SuspendInput `json:"body"`
	}) (*struct {
		Body struct {
			Success bool `json:"success"`
		}
	}, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID kampanye tidak valid", "")
		}
		if err := svc.SetCampaignSuspension(ctx, id, in.Body.IsSuspended, in.Body.Reason); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Success bool `json:"success"`
			}
		}{Body: struct {
			Success bool `json:"success"`
		}{Success: true}}, nil
	})
}

func registerAdminListCourses(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminListCourses",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/courses",
		Summary:     "List all LMS courses including drafts",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []CourseAdminDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		items, err := svc.ListAllCourses(ctx)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []CourseAdminDTO }{Body: items}, nil
	})
}

func registerAdminCreateCourse(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminCreateCourse",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/courses",
		Summary:     "Create a new LMS course",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		Body CreateCourseInput `json:"body"`
	}) (*struct{ Body *CourseAdminDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		item, err := svc.CreateCourse(ctx, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *CourseAdminDTO }{Body: item}, nil
	})
}

func registerAdminUpdateCourse(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminUpdateCourse",
		Method:      http.MethodPut,
		Path:        "/api/v1/admin/courses/{id}",
		Summary:     "Update course details",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string            `path:"id"`
		Body UpdateCourseInput `json:"body"`
	}) (*struct{ Body *CourseAdminDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID kursus tidak valid", "")
		}
		item, err := svc.UpdateCourse(ctx, id, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *CourseAdminDTO }{Body: item}, nil
	})
}

func registerAdminDeleteCourse(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminDeleteCourse",
		Method:      http.MethodDelete,
		Path:        "/api/v1/admin/courses/{id}",
		Summary:     "Delete a course",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct {
		Body struct {
			Success bool `json:"success"`
		}
	}, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID kursus tidak valid", "")
		}
		if err := svc.DeleteCourse(ctx, id); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Success bool `json:"success"`
			}
		}{Body: struct {
			Success bool `json:"success"`
		}{Success: true}}, nil
	})
}

func registerAdminLessonOps(api huma.API, svc *Service) {
	registerAdminListLessons(api, svc)
	registerAdminCreateLesson(api, svc)
	registerAdminUpdateLesson(api, svc)
	registerAdminDeleteLesson(api, svc)
}

func registerAdminListLessons(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminListLessons",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/courses/{id}/lessons",
		Summary:     "List lessons for a course",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct{ Body []LessonAdminDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID kursus tidak valid", "")
		}
		items, err := svc.ListLessons(ctx, id)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []LessonAdminDTO }{Body: items}, nil
	})
}

func registerAdminCreateLesson(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminCreateLesson",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/courses/{id}/lessons",
		Summary:     "Add a lesson module to a course",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string            `path:"id"`
		Body CreateLessonInput `json:"body"`
	}) (*struct{ Body *LessonAdminDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID kursus tidak valid", "")
		}
		item, err := svc.CreateLesson(ctx, id, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *LessonAdminDTO }{Body: item}, nil
	})
}

func registerAdminUpdateLesson(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminUpdateLesson",
		Method:      http.MethodPut,
		Path:        "/api/v1/admin/lessons/{id}",
		Summary:     "Update a lesson module",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string            `path:"id"`
		Body UpdateLessonInput `json:"body"`
	}) (*struct{ Body *LessonAdminDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID modul tidak valid", "")
		}
		item, err := svc.UpdateLesson(ctx, id, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *LessonAdminDTO }{Body: item}, nil
	})
}

func registerAdminDeleteLesson(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminDeleteLesson",
		Method:      http.MethodDelete,
		Path:        "/api/v1/admin/lessons/{id}",
		Summary:     "Delete a lesson module",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct {
		Body struct {
			Success bool `json:"success"`
		}
	}, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID modul tidak valid", "")
		}
		if err := svc.DeleteLesson(ctx, id); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Success bool `json:"success"`
			}
		}{Body: struct {
			Success bool `json:"success"`
		}{Success: true}}, nil
	})
}

func registerAdminListThreads(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminListThreads",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/community/threads",
		Summary:     "List community threads for moderation",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		Limit int32 `query:"limit" default:"50"`
	}) (*struct{ Body []ThreadModerationDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		items, err := svc.ListThreadsForModeration(ctx, in.Limit)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []ThreadModerationDTO }{Body: items}, nil
	})
}

func registerAdminModerateDeleteThread(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminModerateDeleteThread",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/community/threads/{id}/delete",
		Summary:     "Soft-delete / moderate a thread by replacing content with admin notice",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string             `path:"id"`
		Body DeleteContentInput `json:"body"`
	}) (*struct {
		Body struct {
			Success bool `json:"success"`
		}
	}, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID thread tidak valid", "")
		}
		if err := svc.ModerateDeleteThread(ctx, id, in.Body.Reason); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Success bool `json:"success"`
			}
		}{Body: struct {
			Success bool `json:"success"`
		}{Success: true}}, nil
	})
}

func registerAdminModerateDeleteComment(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminModerateDeleteComment",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/community/comments/{id}/delete",
		Summary:     "Soft-delete / moderate a comment by replacing content with admin notice",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string             `path:"id"`
		Body DeleteContentInput `json:"body"`
	}) (*struct {
		Body struct {
			Success bool `json:"success"`
		}
	}, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID komentar tidak valid", "")
		}
		if err := svc.ModerateDeleteComment(ctx, id, in.Body.Reason); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Success bool `json:"success"`
			}
		}{Body: struct {
			Success bool `json:"success"`
		}{Success: true}}, nil
	})
}

func registerAdminSuspendUser(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminSuspendUser",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/users/{id}/suspend",
		Summary:     "Suspend a user account for a specified duration in hours",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID   string           `path:"id"`
		Body SuspendUserInput `json:"body"`
	}) (*struct{ Body *SuspendedUserDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID user tidak valid", "")
		}
		item, err := svc.SuspendUser(ctx, id, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body *SuspendedUserDTO }{Body: item}, nil
	})
}

func registerAdminUnsuspendUser(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminUnsuspendUser",
		Method:      http.MethodPost,
		Path:        "/api/v1/admin/users/{id}/unsuspend",
		Summary:     "Lift suspension from a user account",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, in *struct {
		ID string `path:"id"`
	}) (*struct {
		Body struct {
			Success bool `json:"success"`
		}
	}, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		var id pgtype.UUID
		if err := id.Scan(in.ID); err != nil {
			return nil, apperr.BadRequest(apperr.CodeBadRequest, "Format ID user tidak valid", "")
		}
		if err := svc.UnsuspendUser(ctx, id); err != nil {
			return nil, mapAppError(err)
		}
		return &struct {
			Body struct {
				Success bool `json:"success"`
			}
		}{Body: struct {
			Success bool `json:"success"`
		}{Success: true}}, nil
	})
}

func registerAdminListSuspendedUsers(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "adminListSuspendedUsers",
		Method:      http.MethodGet,
		Path:        "/api/v1/admin/users/suspended",
		Summary:     "List all currently suspended users",
		Tags:        []string{"Admin"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []SuspendedUserDTO }, error) {
		if _, err := middleware.CheckRole(ctx, "superadmin", "admin"); err != nil {
			return nil, mapAppError(err)
		}
		items, err := svc.ListSuspendedUsers(ctx)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []SuspendedUserDTO }{Body: items}, nil
	})
}
