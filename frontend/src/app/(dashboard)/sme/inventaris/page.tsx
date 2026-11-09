"use client";

import React, { useState } from "react";
import { Package, Plus } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useInventory, type CreateItemPayload } from "@/hooks/use-inventory";
import { ItemCard, type InventoryItemData } from "@/components/inventory/ItemCard";
import { ItemFormDialog } from "@/components/inventory/ItemFormDialog";
import { AdjustForm } from "@/components/inventory/AdjustForm";

export default function InventoryPage() {
  const { smeId } = useSession();
  const { items, isLoading, createItem, adjustStock } = useInventory(smeId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemData | null>(null);

  const handleCreate = async (payload: CreateItemPayload) => {
    await createItem.mutateAsync(payload);
  };

  const handleAdjust = async (itemId: string, delta: number, reason: string) => {
    await adjustStock.mutateAsync({ itemId, delta, reason });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E7EB] dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DFE9F1] dark:bg-blue-950/60 text-[#1D5FAE] dark:text-blue-300">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
              Inventaris &amp; Stok Barang
            </h1>
            <p className="text-xs text-[#516072] dark:text-slate-400">
              Manajemen SKU, alert batas stok menipis, dan rekonsiliasi HPP untuk laporan keuangan SAK EMKM.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition active:scale-[0.985]"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Barang SKU</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-xs text-[#516072] dark:text-slate-400">
          Memuat inventaris produk...
        </div>
      ) : items.length === 0 ? (
        <div className="stitch-card flex h-48 flex-col items-center justify-center p-8 text-center border-dashed">
          <Package className="h-8 w-8 text-[#516072] opacity-40 mb-2" />
          <span className="text-sm font-bold text-[#0F1E2E] dark:text-white">
            Belum Ada Barang di Inventaris
          </span>
          <p className="text-xs text-[#516072] dark:text-slate-400 mt-0.5">
            Klik tombol Tambah Barang di atas untuk mendaftarkan SKU dan stok awal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onAdjust={(it) => setAdjustingItem(it)}
            />
          ))}
        </div>
      )}

      <ItemFormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <AdjustForm
        item={adjustingItem}
        isOpen={!!adjustingItem}
        onClose={() => setAdjustingItem(null)}
        onSubmit={handleAdjust}
      />
    </div>
  );
}
