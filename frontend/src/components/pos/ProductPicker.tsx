"use client";

import React, { useState } from "react";
import { AlertTriangle, Search, Package } from "lucide-react";
import { formatIDR } from "@/lib/money";
import { usePosCartStore } from "@/stores/pos-cart-store";

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  stock_qty: number;
  selling_price_idr: number;
  low_stock_threshold: number;
}

interface ProductPickerProps {
  products: PosProduct[];
}

export function ProductPicker({ products }: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const addItem = usePosCartStore((s) => s.addItem);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#516072] dark:text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama barang atau SKU produk..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-[#E2E7EB] bg-white py-2 pl-9 pr-4 text-xs sm:text-sm text-[#0F1E2E] outline-none transition focus:border-[#1D5FAE] focus:ring-1 focus:ring-[#1D5FAE] dark:border-white/[0.08] dark:bg-[#132235] dark:text-white"
        />
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4 p-0.5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[#516072] dark:text-slate-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Tidak ada produk yang cocok dengan &quot;{query}&quot;
          </div>
        ) : (
          filtered.map((item) => {
            const isLowStock = item.stock_qty <= item.low_stock_threshold;
            const isOutOfStock = item.stock_qty <= 0;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isOutOfStock}
                onClick={() =>
                  addItem({
                    itemId: item.id,
                    sku: item.sku,
                    name: item.name,
                    sellingPriceIDR: item.selling_price_idr,
                    stockQty: item.stock_qty,
                  })
                }
                className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${isOutOfStock
                  ? "cursor-not-allowed border-[#E2E7EB] bg-[#F4F3F1] opacity-50 dark:border-white/5 dark:bg-[#0A1624]"
                  : "border-[#E2E7EB] bg-white hover:border-[#1D5FAE] hover:shadow-xs active:scale-[0.985] dark:border-white/[0.08] dark:bg-[#132235] dark:hover:border-[#1D5FAE]"
                  }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-medium text-[#516072] dark:text-slate-400">
                    {item.sku}
                  </span>
                  <h4 className="mt-1 line-clamp-2 text-xs sm:text-sm font-semibold text-[#0F1E2E] dark:text-white leading-snug">
                    {item.name}
                  </h4>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#E2E7EB] dark:border-white/[0.06] pt-2.5">
                  <span className="text-xs font-bold text-[#0F1E2E] dark:text-white tabular-nums">
                    {formatIDR(item.selling_price_idr)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold ${isOutOfStock
                      ? "text-[#BA1A1A] dark:text-red-400"
                      : isLowStock
                        ? "text-[#C58A1E] dark:text-amber-400"
                        : "text-[#1D5FAE] dark:text-blue-300"
                      }`}
                  >
                    {isLowStock && !isOutOfStock && <AlertTriangle className="h-2.5 w-2.5" />}
                    {item.stock_qty} sisa
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
