package payment

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/uhui/backend/internal/middleware"
)

type WalletDTO struct {
	UserID     string `json:"user_id"`
	Currency   string `json:"currency"`
	BalanceIDR int64  `json:"balance_idr"`
}

type TopUpDTO struct {
	UserID     string `json:"user_id"`
	Message    string `json:"message"`
	BalanceIDR int64  `json:"balance_idr"`
	AddedIDR   int64  `json:"added_idr"`
}

func RegisterWalletHandlers(api huma.API, pay *SimulatedProvider) {
	huma.Register(api, huma.Operation{
		OperationID: "getWalletBalance",
		Method:      http.MethodGet,
		Path:        "/api/v1/wallet",
		Summary:     "Get current user wallet balance",
		Tags:        []string{"Wallet"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body WalletDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		bal := pay.GetBalanceContext(ctx, p.UserID)
		return &struct{ Body WalletDTO }{
			Body: WalletDTO{
				UserID:     p.UserID,
				BalanceIDR: bal,
				Currency:   "IDR",
			},
		}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "topUpWallet",
		Method:      http.MethodPost,
		Path:        "/api/v1/wallet/topup",
		Summary:     "Top up simulated wallet balance",
		Tags:        []string{"Wallet"},
	}, func(ctx context.Context, in *struct {
		Body struct {
			AmountIDR int64 `json:"amount_idr" doc:"Amount to top up in IDR" minimum:"1000"`
		}
	}) (*struct{ Body TopUpDTO }, error) {
		p, ok := middleware.GetPrincipal(ctx)
		if !ok || p == nil {
			return nil, huma.NewError(http.StatusUnauthorized, "Autentikasi diperlukan")
		}
		if in.Body.AmountIDR <= 0 {
			return nil, huma.NewError(http.StatusBadRequest, "Nominal top up harus lebih besar dari 0")
		}
		newBal := pay.TopUpContext(ctx, p.UserID, in.Body.AmountIDR)
		return &struct{ Body TopUpDTO }{
			Body: TopUpDTO{
				UserID:     p.UserID,
				BalanceIDR: newBal,
				AddedIDR:   in.Body.AmountIDR,
				Message:    "Top up saldo berhasil",
			},
		}, nil
	})
}
