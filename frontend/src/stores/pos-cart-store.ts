import { create } from "zustand";

export interface CartItem {
  itemId: string;
  sku: string;
  name: string;
  sellingPriceIDR: number;
  stockQty: number;
  qty: number;
}

interface PosCartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (itemId: string) => void;
  updateQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalCount: () => number;
}

export const usePosCartStore = create<PosCartState>((set, get) => ({
  items: [],
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.itemId === product.itemId);
      if (existing) {
        if (existing.qty >= product.stockQty) return state;
        return {
          items: state.items.map((i) =>
            i.itemId === product.itemId ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      if (product.stockQty <= 0) return state;
      return {
        items: [...state.items, { ...product, qty: 1 }],
      };
    });
  },
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.itemId !== itemId),
    }));
  },
  updateQty: (itemId, qty) => {
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.itemId !== itemId) };
      }
      return {
        items: state.items.map((i) => {
          if (i.itemId !== itemId) return i;
          const clamped = Math.min(qty, i.stockQty);
          return { ...i, qty: clamped };
        }),
      };
    });
  },
  clearCart: () => set({ items: [] }),
  getTotalAmount: () => {
    return get().items.reduce((sum, item) => sum + item.sellingPriceIDR * item.qty, 0);
  },
  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },
}));

