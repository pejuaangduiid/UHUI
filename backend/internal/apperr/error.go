package apperr

import (
	"fmt"
	"net/http"
)

type Error struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	Hint       string `json:"hint,omitempty"`
	HTTPStatus int    `json:"status"`
}

func (e *Error) Error() string {
	if e.Hint != "" {
		return fmt.Sprintf("[%s] %s (hint: %s)", e.Code, e.Message, e.Hint)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func New(code string, status int, message, hint string) *Error {
	return &Error{
		Code:       code,
		HTTPStatus: status,
		Message:    message,
		Hint:       hint,
	}
}

func BadRequest(code, message, hint string) *Error {
	return New(code, http.StatusBadRequest, message, hint)
}

func Unauthorized(code, message, hint string) *Error {
	return New(code, http.StatusUnauthorized, message, hint)
}

func Forbidden(code, message, hint string) *Error {
	return New(code, http.StatusForbidden, message, hint)
}

func NotFound(code, message, hint string) *Error {
	return New(code, http.StatusNotFound, message, hint)
}

func Conflict(code, message, hint string) *Error {
	return New(code, http.StatusConflict, message, hint)
}

func Unprocessable(code, message, hint string) *Error {
	return New(code, http.StatusUnprocessableEntity, message, hint)
}

func TooManyRequests(code, message, hint string) *Error {
	return New(code, http.StatusTooManyRequests, message, hint)
}

func Internal(message string) *Error {
	return New("INTERNAL_ERROR", http.StatusInternalServerError, message, "Silakan coba beberapa saat lagi")
}
