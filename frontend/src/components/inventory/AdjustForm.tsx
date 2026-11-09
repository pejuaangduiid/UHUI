"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { InventoryItemData } from "./ItemCard";

interface AdjustFormProps {
  item: InventoryItemData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: string, delta: number, reason: string) => Promise<void>;
}

export function AdjustForm({ item, isOpen, onClose, onSubmit }: AdjustFormProps) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deltaNum = parseInt(delta, 10);
    if (!deltaNum || deltaNum === 0) {
      setError("Perubahan stok tidak boleh 0");
      return;
    }
    if (!reason.trim()) {
      setError("Alasan penyesuaian stok wajib diisi (R1.6)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(item.id, deltaNum, reason.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyesuaikan stok");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Sesuaikan Stok</h3>
            <p className="text-xs text-zinc-500">{item.name} (Sisa: {item.stock_qty})</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-sm">
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Perubahan Stok (+ untuk menambah, - untuk mengurangi)
            </label>
            <input
              type="number"
              required
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="Contoh: 10 atau -5"
              className="mt-1 w-full rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Alasan Penyesuaian (Wajib)
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Stok opname bulanan / barang rusak"
              className="mt-1 w-full rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading ? "Menyimpan..." : "Simpan Penyesuaian"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

