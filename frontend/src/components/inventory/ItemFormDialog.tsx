"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { parseIDR } from "@/lib/money";

interface ItemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    sku: string;
    name: string;
    stock_qty: number;
    unit_cost_idr: number;
    selling_price_idr: number;
    low_stock_threshold: number;
  }) => Promise<void>;
}

export function ItemFormDialog({ isOpen, onClose, onSubmit }: ItemFormDialogProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [threshold, setThreshold] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return setError("SKU dan Nama barang wajib diisi");
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        sku: sku.trim(),
        name: name.trim(),
        stock_qty: parseInt(stockQty, 10) || 0,
        unit_cost_idr: parseIDR(cost),
        selling_price_idr: parseIDR(price),
        low_stock_threshold: parseInt(threshold, 10) || 5,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan barang");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Tambah Barang Baru</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">SKU / Kode Barang</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Contoh: BRG-001"
              className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Nama Barang</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Beras Premium 5kg"
              className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Harga Beli (Rp)</label>
              <input
                type="text"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="50000"
                className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Harga Jual (Rp)</label>
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="65000"
                className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Stok Awal</label>
              <input
                type="number"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Ambang Menipis</label>
              <input
                type="number"
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400">Batal</button>
              <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                {loading ? "Menyimpan..." : "Simpan Barang"}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}
