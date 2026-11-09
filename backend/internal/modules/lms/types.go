package lms

import "time"

type CourseDTO struct {
	CreatedAt      time.Time `json:"created_at"`
	ThumbnailURL   *string   `json:"thumbnail_url,omitempty"`
	ID             string    `json:"id"`
	Slug           string    `json:"slug"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	InstructorName string    `json:"instructor_name"`
	Level          string    `json:"level"`
	PriceIDR       int64     `json:"price_idr"`
	LessonCount    int64     `json:"lesson_count"`
	StudentCount   int64     `json:"student_count"`
	IsEnrolled     bool      `json:"is_enrolled"`
}

type LessonDTO struct {
	VideoURL        *string `json:"video_url,omitempty"`
	ContentText     *string `json:"content_text,omitempty"`
	ID              string  `json:"id"`
	CourseID        string  `json:"course_id"`
	Title           string  `json:"title"`
	SortOrder       int32   `json:"sort_order"`
	DurationMinutes int32   `json:"duration_minutes"`
}

type CourseDetailDTO struct {
	Lessons []LessonDTO `json:"lessons"`
	CourseDTO
	Progress int32 `json:"progress_percent"`
}

type WebinarDTO struct {
	ScheduledAt        time.Time `json:"scheduled_at"`
	CreatedAt          time.Time `json:"created_at"`
	BannerURL          *string   `json:"banner_url,omitempty"`
	StreamURL          *string   `json:"stream_url,omitempty"`
	RelatedCourseTitle *string   `json:"related_course_title,omitempty"`
	RelatedCourseSlug  *string   `json:"related_course_slug,omitempty"`
	ID                 string    `json:"id"`
	Slug               string    `json:"slug"`
	Title              string    `json:"title"`
	SpeakerName        string    `json:"speaker_name"`
	SpeakerRole        string    `json:"speaker_role"`
	RegistrationCount  int64     `json:"registration_count"`
	IsFree             bool      `json:"is_free"`
	IsRegistered       bool      `json:"is_registered"`
}

type EnrollCourseRequest struct {
	CourseID string `json:"course_id"`
}

type EnrollCourseResponse struct {
	EnrolledAt   time.Time `json:"enrolled_at"`
	EnrollmentID string    `json:"enrollment_id"`
	CourseID     string    `json:"course_id"`
	Status       string    `json:"status"`
	AmountPaid   int64     `json:"amount_paid_idr"`
}
