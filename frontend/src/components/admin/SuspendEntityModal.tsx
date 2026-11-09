"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface SuspendEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityName: string;
  isCurrentlySuspended: boolean;
  onConfirm: (isSuspended: boolean, reason?: string) => Promise<void>;
  isLoading: boolean;
}

export function SuspendEntityModal({
  isOpen,
  onClose,
  title,
  entityName,
  isCurrentlySuspended,
  onConfirm,
  isLoading,
}: SuspendEntityModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(!isCurrentlySuspended, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121827] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isCurrentlySuspended ? "bg-blue-500/10 text-blue-500" : "bg-rose-500/10 text-rose-500"
              }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            {isCurrentlySuspended ? (
              <>Apakah Anda yakin ingin <strong className="text-blue-500">mengaktifkan kembali</strong> akses untuk <strong>{entityName}</strong>?</>
            ) : (
              <>Apakah Anda yakin ingin <strong className="text-rose-500">menangguhkan (suspend)</strong> <strong>{entityName}</strong>? Tindakan ini akan menghentikan transaksi atau aktivitas investasi terkait.</>
            )}
          </p>

          {!isCurrentlySuspended && (
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Alasan Penangguhan:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Misal: Pelanggaran transparansi laporan keuangan atau audit kepatuhan legal..."
                rows={3}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-rose-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-white"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl font-bold text-white transition ${isCurrentlySuspended
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-rose-600 hover:bg-rose-500"
                }`}
            >
              {isLoading ? "Memproses..." : isCurrentlySuspended ? "Aktifkan Kembali" : "Tangguhkan Entitas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

