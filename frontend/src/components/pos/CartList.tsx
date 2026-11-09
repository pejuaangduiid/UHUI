"use client";

import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatIDR } from "@/lib/money";
import { usePosCartStore } from "@/stores/pos-cart-store";

export function CartList() {
  const { items, updateQty, removeItem, clearCart } = usePosCartStore();

  if (items.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 text-center text-sm text-zinc-400 dark:border-zinc-800">
        <span>Keranjang kosong</span>
        <span className="text-xs text-zinc-400">Pilih produk di samping untuk menambahkan</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Item ({items.length})
        </span>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-red-500 hover:underline"
        >
          Kosongkan
        </button>
      </div>

      <div className="divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
        {items.map((item) => (
          <div key={item.itemId} className="flex items-center justify-between py-2.5">
            <div className="min-w-0 flex-1 pr-2">
              <h5 className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                {item.name}
              </h5>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                {formatIDR(item.sellingPriceIDR)} × {item.qty} ={" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatIDR(item.sellingPriceIDR * item.qty)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateQty(item.itemId, item.qty - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-zinc-900 dark:text-zinc-50">
                {item.qty}
              </span>
              <button
                type="button"
                onClick={() => updateQty(item.itemId, item.qty + 1)}
                disabled={item.qty >= item.stockQty}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.itemId)}
                className="ml-1 text-zinc-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

