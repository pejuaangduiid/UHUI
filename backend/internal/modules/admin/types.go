package admin

import "time"

type StatsDTO struct {
	TotalSMEs          int64 `json:"total_smes"`
	SuspendedSMEs      int64 `json:"suspended_smes"`
	TotalCampaigns     int64 `json:"total_campaigns"`
	SuspendedCampaigns int64 `json:"suspended_campaigns"`
	TotalCourses       int64 `json:"total_courses"`
	TotalThreads       int64 `json:"total_threads"`
	ModeratedThreads   int64 `json:"moderated_threads"`
	SuspendedUsers     int64 `json:"suspended_users"`
}

type SMEAdminDTO struct {
	CreatedAt             time.Time `json:"created_at"`
	DigitalReadinessScore *int16    `json:"digital_readiness_score,omitempty"`
	SuspensionReason      *string   `json:"suspension_reason,omitempty"`
	OwnerName             string    `json:"owner_name"`
	OwnerEmail            string    `json:"owner_email"`
	BusinessName          string    `json:"business_name"`
	Slug                  string    `json:"slug"`
	Sector                string    `json:"sector"`
	Description           string    `json:"description"`
	OwnerID               string    `json:"owner_id"`
	ID                    string    `json:"id"`
	IsIncorporatedPT      bool      `json:"is_incorporated_pt"`
	IsListedOnBursa       bool      `json:"is_listed_on_bursa"`
	IsSuspended           bool      `json:"is_suspended"`
}

type SuspendInput struct {
	Reason      string `json:"reason,omitempty"`
	IsSuspended bool   `json:"is_suspended"`
}

type CampaignAdminDTO struct {
	CreatedAt        time.Time `json:"created_at"`
	ClosesAt         time.Time `json:"closes_at"`
	SuspensionReason *string   `json:"suspension_reason,omitempty"`
	BusinessName     string    `json:"business_name"`
	Scheme           string    `json:"scheme"`
	Sector           string    `json:"sector"`
	OwnerName        string    `json:"owner_name"`
	OwnerEmail       string    `json:"owner_email"`
	Slug             string    `json:"slug"`
	Title            string    `json:"title"`
	SMEID            string    `json:"sme_id"`
	Status           string    `json:"status"`
	ID               string    `json:"id"`
	TargetAmountIDR  int64     `json:"target_amount_idr"`
	RaisedAmountIDR  int64     `json:"raised_amount_idr"`
	MinInvestmentIDR int64     `json:"min_investment_idr"`
	ReturnShareBps   int16     `json:"return_share_bps"`
	TermMonths       int16     `json:"term_months"`
	IsSuspended      bool      `json:"is_suspended"`
}

type CourseAdminDTO struct {
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
	IsPublished    bool      `json:"is_published"`
}

type CreateCourseInput struct {
	Title          string `json:"title"`
	Slug           string `json:"slug"`
	Description    string `json:"description"`
	InstructorName string `json:"instructor_name"`
	Level          string `json:"level"`
	ThumbnailURL   string `json:"thumbnail_url,omitempty"`
	PriceIDR       int64  `json:"price_idr"`
	IsPublished    bool   `json:"is_published"`
}

type UpdateCourseInput struct {
	Title          string `json:"title"`
	Description    string `json:"description"`
	InstructorName string `json:"instructor_name"`
	Level          string `json:"level"`
	ThumbnailURL   string `json:"thumbnail_url,omitempty"`
	PriceIDR       int64  `json:"price_idr"`
	IsPublished    bool   `json:"is_published"`
}

type LessonAdminDTO struct {
	CreatedAt       time.Time `json:"created_at"`
	VideoURL        *string   `json:"video_url,omitempty"`
	ContentText     *string   `json:"content_text,omitempty"`
	ID              string    `json:"id"`
	CourseID        string    `json:"course_id"`
	Title           string    `json:"title"`
	SortOrder       int32     `json:"sort_order"`
	DurationMinutes int32     `json:"duration_minutes"`
}

type CreateLessonInput struct {
	Title           string `json:"title"`
	ContentText     string `json:"content_text,omitempty"`
	VideoURL        string `json:"video_url,omitempty"`
	SortOrder       int32  `json:"sort_order"`
	DurationMinutes int32  `json:"duration_minutes"`
}

type UpdateLessonInput struct {
	Title           string `json:"title"`
	ContentText     string `json:"content_text,omitempty"`
	VideoURL        string `json:"video_url,omitempty"`
	SortOrder       int32  `json:"sort_order"`
	DurationMinutes int32  `json:"duration_minutes"`
}

type ThreadModerationDTO struct {
	CreatedAt            time.Time  `json:"created_at"`
	AuthorSuspendedUntil *time.Time `json:"author_suspended_until,omitempty"`
	GroupID              *string    `json:"group_id,omitempty"`
	GroupName            *string    `json:"group_name,omitempty"`
	GroupSlug            *string    `json:"group_slug,omitempty"`
	AdminDeleteReason    *string    `json:"admin_delete_reason,omitempty"`
	ID                   string     `json:"id"`
	AuthorID             string     `json:"author_id"`
	AuthorName           string     `json:"author_name"`
	AuthorEmail          string     `json:"author_email"`
	AuthorRole           string     `json:"author_role"`
	Visibility           string     `json:"visibility"`
	Kind                 string     `json:"kind"`
	Title                string     `json:"title"`
	Content              string     `json:"content"`
	CommentCount         int64      `json:"comment_count"`
	UpvotesCount         int32      `json:"upvotes_count"`
	IsDeletedByAdmin     bool       `json:"is_deleted_by_admin"`
}

type DeleteContentInput struct {
	Reason string `json:"reason"`
}

type SuspendUserInput struct {
	Reason        string `json:"reason"`
	DurationHours int    `json:"duration_hours"`
}

type SuspendedUserDTO struct {
	CreatedAt        time.Time `json:"created_at"`
	SuspendedUntil   time.Time `json:"suspended_until"`
	SuspensionReason *string   `json:"suspension_reason,omitempty"`
	ID               string    `json:"id"`
	Email            string    `json:"email"`
	FullName         string    `json:"full_name"`
	Role             string    `json:"role"`
}
