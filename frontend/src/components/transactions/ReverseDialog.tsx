"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { formatIDR } from "@/lib/money";
import type { TransactionData } from "./TxRow";

interface ReverseDialogProps {
  tx: TransactionData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (txId: string, reason: string) => Promise<void>;
}

export function ReverseDialog({ tx, isOpen, onClose, onConfirm }: ReverseDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !tx) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Alasan pembalikan wajib diisi");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(tx.id, reason.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membalikkan transaksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Balikkan Transaksi</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{tx.description}</p>
          <p className="mt-1 font-bold text-zinc-700 dark:text-zinc-300">
            Nominal: {formatIDR(tx.total_amount_idr)}
          </p>
          <p className="mt-1 text-zinc-500">
            Pembalikan akan membuat baris offset di ledger dan memulihkan stok inventaris (R1.7).
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-sm">
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Alasan Pembalikan (Wajib)
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Salah input nominal kasir"
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
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Ya, Balikkan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

