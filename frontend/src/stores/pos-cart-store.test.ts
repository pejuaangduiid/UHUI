import { describe, expect, it, beforeEach } from "vitest";
import { usePosCartStore } from "./pos-cart-store";

describe("RF.POS.1 Cashier Store Optimistic Updates", () => {
  beforeEach(() => {
    usePosCartStore.getState().clearCart();
  });

  it("adds item and clamps quantity at stock limit", () => {
    const store = usePosCartStore.getState();

    store.addItem({
      itemId: "item-1",
      sku: "SKU-1",
      name: "Beras",
      sellingPriceIDR: 50_000,
      stockQty: 2,
    });

    expect(usePosCartStore.getState().items).toHaveLength(1);
    expect(usePosCartStore.getState().items[0]?.qty).toBe(1);

    usePosCartStore.getState().addItem({
      itemId: "item-1",
      sku: "SKU-1",
      name: "Beras",
      sellingPriceIDR: 50_000,
      stockQty: 2,
    });
    expect(usePosCartStore.getState().items[0]?.qty).toBe(2);

    usePosCartStore.getState().addItem({
      itemId: "item-1",
      sku: "SKU-1",
      name: "Beras",
      sellingPriceIDR: 50_000,
      stockQty: 2,
    });
    expect(usePosCartStore.getState().items[0]?.qty).toBe(2);

    expect(usePosCartStore.getState().getTotalAmount()).toBe(100_000);
  });
});

