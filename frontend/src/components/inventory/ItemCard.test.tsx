import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ItemCard, type InventoryItemData } from "./ItemCard";

describe("RF.INV.1 Low Stock Indicator", () => {
  it("renders both icon and text when stock is at or below threshold", () => {
    const lowStockItem: InventoryItemData = {
      id: "item-1",
      sku: "BRG-01",
      name: "Minyak Goreng",
      stock_qty: 2,
      unit_cost_idr: 14_000,
      selling_price_idr: 18_000,
      low_stock_threshold: 5,
    };

    const html = renderToString(React.createElement(ItemCard, { item: lowStockItem }));

    expect(html).toContain('data-testid="low-stock-indicator"');
    
    expect(html).toContain("Stok Menipis");
    
    expect(html).toContain("<svg");
  });

  it("does not render low stock indicator when stock is above threshold", () => {
    const normalItem: InventoryItemData = {
      id: "item-2",
      sku: "BRG-02",
      name: "Gula Pasir",
      stock_qty: 20,
      unit_cost_idr: 12_000,
      selling_price_idr: 15_000,
      low_stock_threshold: 5,
    };

    const html = renderToString(React.createElement(ItemCard, { item: normalItem }));
    expect(html).not.toContain('data-testid="low-stock-indicator"');
  });
});
