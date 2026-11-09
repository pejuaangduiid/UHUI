package auth

import (
	"context"
	"fmt"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/config"
	"github.com/uhui/backend/internal/middleware"
)

type UserDTO struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type LoginInputBody struct {
	Email    string `json:"email" doc:"User email" example:"budi@warungberkah.id"`
	Password string `json:"password" doc:"Password" example:"secret123"`
}

type RegisterInputBody struct {
	Email        string `json:"email" doc:"Valid email address" example:"budi@warungberkah.id"`
	Password     string `json:"password" doc:"Password minimum 8 characters" minLength:"8"`
	FullName     string `json:"full_name" doc:"Full legal name" example:"Budi Santoso"`
	Role         string `json:"role,omitempty" doc:"Account role (defaults to sme_owner)" enum:"sme_owner,investor"`
	BusinessName string `json:"business_name,omitempty" doc:"Optional initial business name"`
	Sector       string `json:"sector,omitempty" doc:"Optional business sector"`
	PdpConsent   bool   `json:"pdp_consent" doc:"Explicit consent for PDP Law compliance"`
}

type AuthOutput struct {
	Body struct {
		User  UserDTO `json:"user"`
		SMEID string  `json:"sme_id,omitempty"`
	}
	SetCookie []string `header:"Set-Cookie"`
}

type MeOutput struct {
	Body struct {
		User  UserDTO `json:"user"`
		SMEID string  `json:"sme_id,omitempty"`
	}
}

type LogoutOutput struct {
	Body struct {
		Status string `json:"status" example:"ok"`
	}
	SetCookie []string `header:"Set-Cookie"`
}

func RegisterHandlers(api huma.API, svc *Service, cfg *config.Config) {
	registerRegister(api, svc, cfg)
	registerLogin(api, svc, cfg)
	registerRefresh(api, svc, cfg)
	registerLogout(api, svc, cfg)
	registerGetMe(api, svc)
}

func registerRegister(api huma.API, svc *Service, cfg *config.Config) {
	huma.Register(api, huma.Operation{
		OperationID: "authRegister",
		Method:      http.MethodPost,
		Path:        "/api/v1/auth/register",
		Summary:     "Register new user",
		Description: "Creates user and SME profile atomically if role is sme_owner.",
		Tags:        []string{"Auth"},
	}, func(ctx context.Context, in *struct{ Body RegisterInputBody }) (*AuthOutput, error) {
		res, err := svc.Register(ctx, RegisterInput{
			Email:        in.Body.Email,
			Password:     in.Body.Password,
			FullName:     in.Body.FullName,
			Role:         in.Body.Role,
			PdpConsent:   in.Body.PdpConsent,
			BusinessName: in.Body.BusinessName,
			Sector:       in.Body.Sector,
		})
		if err != nil {
			return nil, mapAppError(err)
		}
		resp := &AuthOutput{SetCookie: buildAuthCookies(res.AccessToken, res.RefreshToken, cfg)}
		resp.Body.User = UserDTO{ID: uuidToString(res.User.ID), Email: res.User.Email, FullName: res.User.FullName, Role: string(res.User.Role)}
		resp.Body.SMEID = res.SMEID
		return resp, nil
	})
}

func registerLogin(api huma.API, svc *Service, cfg *config.Config) {
	huma.Register(api, huma.Operation{
		OperationID: "authLogin",
		Method:      http.MethodPost,
		Path:        "/api/v1/auth/login",
		Summary:     "Login user",
		Description: "Authenticates credentials and returns secure cookies.",
		Tags:        []string{"Auth"},
	}, func(ctx context.Context, in *struct {
		Body LoginInputBody
	}) (*AuthOutput, error) {
		res, err := svc.Login(ctx, in.Body.Email, in.Body.Password)
		if err != nil {
			return nil, mapAppError(err)
		}
		resp := &AuthOutput{SetCookie: buildAuthCookies(res.AccessToken, res.RefreshToken, cfg)}
		resp.Body.User = UserDTO{ID: uuidToString(res.User.ID), Email: res.User.Email, FullName: res.User.FullName, Role: string(res.User.Role)}
		resp.Body.SMEID = res.SMEID
		return resp, nil
	})
}

func registerRefresh(api huma.API, svc *Service, cfg *config.Config) {
	huma.Register(api, huma.Operation{
		OperationID: "authRefresh",
		Method:      http.MethodPost,
		Path:        "/api/v1/auth/refresh",
		Summary:     "Refresh access token",
		Description: "Rotates refresh token and returns new session tokens.",
		Tags:        []string{"Auth"},
	}, func(ctx context.Context, in *struct {
		RefreshCookie string `cookie:"__Secure-refresh"`
		DevCookie     string `cookie:"uhui_refresh"`
	}) (*AuthOutput, error) {
		rawToken := in.RefreshCookie
		if rawToken == "" {
			rawToken = in.DevCookie
		}
		res, err := svc.Refresh(ctx, rawToken)
		if err != nil {
			return nil, mapAppError(err)
		}
		resp := &AuthOutput{SetCookie: buildAuthCookies(res.AccessToken, res.RefreshToken, cfg)}
		resp.Body.User = UserDTO{ID: uuidToString(res.User.ID), Email: res.User.Email, FullName: res.User.FullName, Role: string(res.User.Role)}
		resp.Body.SMEID = res.SMEID
		return resp, nil
	})
}

func registerLogout(api huma.API, svc *Service, cfg *config.Config) {
	huma.Register(api, huma.Operation{
		OperationID: "authLogout",
		Method:      http.MethodPost,
		Path:        "/api/v1/auth/logout",
		Summary:     "Logout user",
		Description: "Revokes refresh token and clears session cookies.",
		Tags:        []string{"Auth"},
	}, func(ctx context.Context, in *struct {
		RefreshCookie string `cookie:"__Secure-refresh"`
		DevCookie     string `cookie:"uhui_refresh"`
	}) (*LogoutOutput, error) {
		rawToken := in.RefreshCookie
		if rawToken == "" {
			rawToken = in.DevCookie
		}
		_ = svc.Logout(ctx, rawToken)
		secure := !cfg.CookieInsecure || !cfg.IsDev()
		resp := &LogoutOutput{
			SetCookie: []string{
				fmt.Sprintf("%s=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax%s", middleware.AccessCookieName(cfg), cookieSecureFlag(secure)),
				fmt.Sprintf("%s=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax%s", middleware.RefreshCookieName(cfg), cookieSecureFlag(secure)),
				fmt.Sprintf("%s=; Path=/api/v1/auth; Max-Age=0; HttpOnly; SameSite=Lax%s", middleware.RefreshCookieName(cfg), cookieSecureFlag(secure)),
			},
		}
		resp.Body.Status = "ok"
		return resp, nil
	})
}

func registerGetMe(api huma.API, svc *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "authGetMe",
		Method:      http.MethodGet,
		Path:        "/api/v1/auth/me",
		Summary:     "Get current user profile",
		Description: "Returns current authenticated user details and active sme_id if SME owner.",
		Tags:        []string{"Auth"},
	}, func(ctx context.Context, _ *struct{}) (*MeOutput, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		user, smeID, err := svc.GetMe(ctx, p.UserID)
		if err != nil {
			return nil, mapAppError(err)
		}
		resp := &MeOutput{}
		resp.Body.User = UserDTO{ID: uuidToString(user.ID), Email: user.Email, FullName: user.FullName, Role: string(user.Role)}
		resp.Body.SMEID = smeID
		return resp, nil
	})
}

func buildAuthCookies(accessToken, refreshToken string, cfg *config.Config) []string {
	secure := !cfg.CookieInsecure || !cfg.IsDev()
	secFlag := cookieSecureFlag(secure)
	return []string{
		fmt.Sprintf("%s=%s; Path=/; Max-Age=900; HttpOnly; SameSite=Lax%s", middleware.AccessCookieName(cfg), accessToken, secFlag),
		fmt.Sprintf("%s=%s; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax%s", middleware.RefreshCookieName(cfg), refreshToken, secFlag),
	}
}

func cookieSecureFlag(secure bool) string {
	if secure {
		return "; Secure"
	}
	return ""
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
