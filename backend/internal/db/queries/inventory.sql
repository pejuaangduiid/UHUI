-- name: ListInventoryItems :many
SELECT id, sme_id, sku, name, stock_qty, unit_cost_idr, selling_price_idr, low_stock_threshold, updated_at
FROM inventory_items
WHERE sme_id = $1
ORDER BY name ASC;

-- name: GetInventoryItemByID :one
SELECT id, sme_id, sku, name, stock_qty, unit_cost_idr, selling_price_idr, low_stock_threshold, updated_at
FROM inventory_items
WHERE id = $1 AND sme_id = $2;

-- name: GetInventoryItemBySKU :one
SELECT id, sme_id, sku, name, stock_qty, unit_cost_idr, selling_price_idr, low_stock_threshold, updated_at
FROM inventory_items
WHERE sme_id = $1 AND sku = $2;

-- name: CreateInventoryItem :one
INSERT INTO inventory_items (
  sme_id, sku, name, stock_qty, unit_cost_idr, selling_price_idr, low_stock_threshold
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
) RETURNING id, sme_id, sku, name, stock_qty, unit_cost_idr, selling_price_idr, low_stock_threshold, updated_at;

-- name: UpdateInventoryItem :one
UPDATE inventory_items
SET name = $3,
    unit_cost_idr = $4,
    selling_price_idr = $5,
    low_stock_threshold = $6,
    updated_at = NOW()
WHERE id = $1 AND sme_id = $2
RETURNING id, sme_id, sku, name, stock_qty, unit_cost_idr, selling_price_idr, low_stock_threshold, updated_at;

-- name: UpdateStockQty :one
UPDATE inventory_items
SET stock_qty = stock_qty + $3,
    updated_at = NOW()
WHERE id = $1 AND sme_id = $2
RETURNING id, sme_id, sku, name, stock_qty, unit_cost_idr, selling_price_idr, low_stock_threshold, updated_at;

