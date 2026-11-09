"use client";

import React from "react";
import { formatIDR } from "@/lib/money";
import { Package, PlusCircle, Check } from "lucide-react";
import type { ScanItemProposal } from "@/stores/scan-store";
import type { PosProduct } from "../pos/ProductPicker";

interface ProposalTableProps {
  items: ScanItemProposal[];
  inventoryItems: PosProduct[];
  onMapItem: (index: number, inventoryItemId: string) => void;
}

export function ProposalTable({ items, inventoryItems, onMapItem }: ProposalTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
        <span>Item yang Terbaca dari Nota ({items.length})</span>
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 capitalize flex items-center gap-1">
          <Package className="h-3 w-3" /> Masuk Inventaris
        </span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map((item, idx) => {
          const matchedProd = inventoryItems.find((p) => p.id === item.matchedInventoryItemId);
          return (
            <div key={idx} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.description}</span>
                  {matchedProd ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      <Check className="h-2.5 w-2.5" /> Stok +{item.qty} ({matchedProd.name})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      <PlusCircle className="h-2.5 w-2.5" /> Item Baru +{item.qty} Stok
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {item.qty} × {formatIDR(item.unitPriceIDR)} ={" "}
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatIDR(item.lineTotalIDR)}</span>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <select
                  value={item.matchedInventoryItemId ?? ""}
                  onChange={(e) => onMapItem(idx, e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2 text-xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <option value="">+ Buat sebagai Item Baru di Inventaris</option>
                  {inventoryItems.length > 0 && (
                    <optgroup label="Atau Hubungkan ke Barang yang Sudah Ada">
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.sku})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
