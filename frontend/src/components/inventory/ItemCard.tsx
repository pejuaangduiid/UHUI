"use client";

import React from "react";
import { AlertTriangle, Edit3 } from "lucide-react";
import { formatIDR } from "@/lib/money";

export interface InventoryItemData {
  id: string;
  sku: string;
  name: string;
  stock_qty: number;
  unit_cost_idr: number;
  selling_price_idr: number;
  low_stock_threshold: number;
}

interface ItemCardProps {
  item: InventoryItemData;
  onAdjust?: (item: InventoryItemData) => void;
}

export function ItemCard({ item, onAdjust }: ItemCardProps) {
  const isLowStock = item.stock_qty <= item.low_stock_threshold;
  const isOutOfStock = item.stock_qty <= 0;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-mono font-medium text-zinc-400">{item.sku}</span>
          {isLowStock && (
            <span
              data-testid="low-stock-indicator"
              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Stok Menipis</span>
            </span>
          )}
        </div>
        <h3 className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</h3>
      </div>

      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Harga Jual</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {formatIDR(item.selling_price_idr)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Harga Beli / Pokok</span>
          <span className="text-zinc-600 dark:text-zinc-400">{formatIDR(item.unit_cost_idr)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Sisa Stok</span>
          <span
            className={`font-semibold ${isOutOfStock
                ? "text-red-500"
                : isLowStock
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
          >
            {item.stock_qty} unit
          </span>
        </div>
      </div>

      {onAdjust && (
        <button
          type="button"
          onClick={() => onAdjust(item)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Sesuaikan Stok</span>
        </button>
      )}
    </div>
  );
}