package inventory

import (
	"context"
	"fmt"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/uhui/backend/internal/apperr"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/middleware"
)

type ItemDTO struct {
	ID                string `json:"id"`
	SmeID             string `json:"sme_id"`
	SKU               string `json:"sku"`
	Name              string `json:"name"`
	UnitCostIDR       int64  `json:"unit_cost_idr"`
	SellingPriceIDR   int64  `json:"selling_price_idr"`
	StockQty          int32  `json:"stock_qty"`
	LowStockThreshold int32  `json:"low_stock_threshold"`
}

func RegisterHandlers(api huma.API, svc *Service, pool *pgxpool.Pool) {
	registerList(api, svc, pool)
	registerCreate(api, svc, pool)
	registerUpdate(api, svc, pool)
	registerAdjust(api, svc, pool)
	registerMovements(api, svc, pool)
}

func registerList(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "inventoryList",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/inventory",
		Summary:     "List inventory items",
		Tags:        []string{"Inventory"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
	}) (*struct{ Body []ItemDTO }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		items, err := svc.ListItems(ctx, sid)
		if err != nil {
			return nil, mapAppError(err)
		}
		res := make([]ItemDTO, len(items))
		for i, it := range items {
			res[i] = toItemDTO(it)
		}
		return &struct{ Body []ItemDTO }{Body: res}, nil
	})
}

func registerCreate(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "inventoryCreate",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/inventory",
		Summary:     "Create inventory item",
		Tags:        []string{"Inventory"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		Body  CreateItemInput
	}) (*struct{ Body ItemDTO }, error) {
		if _, err := middleware.CheckSMEOwnerActive(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		item, err := svc.CreateItem(ctx, sid, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body ItemDTO }{Body: toItemDTO(*item)}, nil
	})
}

func registerUpdate(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "inventoryUpdate",
		Method:      http.MethodPatch,
		Path:        "/api/v1/smes/{sme_id}/inventory/{id}",
		Summary:     "Update inventory item",
		Tags:        []string{"Inventory"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		ID    string `path:"id"`
		Body  UpdateItemInput
	}) (*struct{ Body ItemDTO }, error) {
		if _, err := middleware.CheckSMEOwnerActive(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid, iid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		_ = iid.Scan(in.ID)
		item, err := svc.UpdateItem(ctx, sid, iid, in.Body)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body ItemDTO }{Body: toItemDTO(*item)}, nil
	})
}

func registerAdjust(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "inventoryAdjust",
		Method:      http.MethodPost,
		Path:        "/api/v1/smes/{sme_id}/inventory/{id}/adjust",
		Summary:     "Adjust stock quantity with reason",
		Tags:        []string{"Inventory"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		ID    string `path:"id"`
		Body  struct {
			Reason   string `json:"reason"`
			DeltaQty int32  `json:"delta_qty"`
		}
	}) (*struct{ Body ItemDTO }, error) {
		if _, err := middleware.CheckSMEOwnerActive(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid, iid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		_ = iid.Scan(in.ID)
		item, err := svc.AdjustStock(ctx, sid, iid, in.Body.DeltaQty, in.Body.Reason)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body ItemDTO }{Body: toItemDTO(*item)}, nil
	})
}

func registerMovements(api huma.API, svc *Service, pool *pgxpool.Pool) {
	huma.Register(api, huma.Operation{
		OperationID: "inventoryMovements",
		Method:      http.MethodGet,
		Path:        "/api/v1/smes/{sme_id}/inventory/{id}/movements",
		Summary:     "List stock movements",
		Tags:        []string{"Inventory"},
	}, func(ctx context.Context, in *struct {
		SMEID string `path:"sme_id"`
		ID    string `path:"id"`
	}) (*struct{ Body []gen.StockMovement }, error) {
		if _, err := middleware.CheckSMEOwner(ctx, pool, in.SMEID); err != nil {
			return nil, mapAppError(err)
		}
		var sid, iid pgtype.UUID
		_ = sid.Scan(in.SMEID)
		_ = iid.Scan(in.ID)
		moves, err := svc.ListMovements(ctx, sid, iid, 50)
		if err != nil {
			return nil, mapAppError(err)
		}
		return &struct{ Body []gen.StockMovement }{Body: moves}, nil
	})
}

func toItemDTO(it gen.InventoryItem) ItemDTO {
	return ItemDTO{
		ID:                uuidToString(it.ID),
		SmeID:             uuidToString(it.SmeID),
		SKU:               it.Sku,
		Name:              it.Name,
		StockQty:          it.StockQty,
		UnitCostIDR:       it.UnitCostIdr,
		SellingPriceIDR:   it.SellingPriceIdr,
		LowStockThreshold: it.LowStockThreshold,
	}
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	src := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", src[0:4], src[4:6], src[6:8], src[8:10], src[10:16])
}

func mapAppError(err error) error {
	if appErr, ok := err.(*apperr.Error); ok {
		return apperr.HumaStatusError(appErr)
	}
	return huma.NewError(http.StatusInternalServerError, err.Error())
}
