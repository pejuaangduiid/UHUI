"use client";

import React, { useState } from "react";
import { UserX, X } from "lucide-react";

interface SuspendUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  onConfirm: (userId: string, durationHours: number, reason: string) => Promise<void>;
  isLoading: boolean;
}

export function SuspendUserModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  onConfirm,
  isLoading,
}: SuspendUserModalProps) {
  const [hours, setHours] = useState(24);
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const presets = [
    { label: "1 Jam", val: 1 },
    { label: "6 Jam", val: 6 },
    { label: "24 Jam (1 Hari)", val: 24 },
    { label: "3 Hari", val: 72 },
    { label: "7 Hari (1 Minggu)", val: 168 },
    { label: "Permanen", val: 876000 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(userId, hours, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121827] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <UserX className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tangguhkan (Suspend) Pengguna</h3>
              <p className="text-[11px] text-slate-400">{userName} ({userEmail})</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Pilih Durasi Penangguhan:</label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setHours(p.val)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition ${
                    hours === p.val
                      ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                      : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Alasan Penangguhan *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Spam postingan komersial berulang kali atau perkataan tidak pantas..."
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-rose-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Selama masa penangguhan, pengguna tidak dapat membuat postingan baru, mengirim komentar, ataupun memberikan vote di seluruh forum komunitas.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white shadow-md shadow-rose-500/25 transition disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : "Terapkan Penangguhan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

