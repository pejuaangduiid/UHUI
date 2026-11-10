"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, UserX } from "lucide-react";
import { SuspendUserModal } from "./SuspendUserModal";
import type { components } from "@/types/api";

type ThreadModerationDTO = components["schemas"]["ThreadModerationDTO"];

interface AdminThreadModerationListProps {
  threads: ThreadModerationDTO[];
  onDeleteThread: (id: string, reason: string) => Promise<void>;
  onSuspendUser: (userId: string, durationHours: number, reason: string) => Promise<void>;
  isLoading: boolean;
}

export function AdminThreadModerationList({
  threads,
  onDeleteThread,
  onSuspendUser,
  isLoading,
}: AdminThreadModerationListProps) {
  const [userToSuspend, setUserToSuspend] = useState<{ id: string; name: string; email: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = threads.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase()) ||
    t.author_name.toLowerCase().includes(search.toLowerCase()) ||
    t.author_email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (thread: ThreadModerationDTO) => {
    const reason = window.prompt(`Alasan moderasi/penghapusan postingan "${thread.title}":`, "Melanggar tata tertib komunitas UHUI");
    if (reason !== null && reason.trim() !== "") {
      await onDeleteThread(thread.id, reason.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari postingan, penulis, atau isi..."
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-[#1D5FAE] dark:border-white/10 dark:bg-[#121827] dark:text-white"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400">Total: {filtered.length} Postingan</span>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const isAuthorSuspended = t.author_suspended_until && new Date(t.author_suspended_until) > new Date();
          return (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border transition shadow-sm bg-white dark:bg-[#121827] ${t.is_deleted_by_admin
                  ? "border-amber-500/30 bg-amber-500/[0.02]"
                  : "border-slate-200/80 dark:border-white/[0.07]"
                }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-[240px]">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{t.author_name}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">{t.author_email}</span>
                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                      {t.author_role}
                    </span>
                    {t.group_name && (
                      <span className="text-[10px] font-bold text-[#1D5FAE] bg-[#DFE9F1] dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        {t.group_name}
                      </span>
                    )}
                    {isAuthorSuspended && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Akun Ditangguhkan
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{t.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-2">
                    {t.content}
                  </p>
                  {t.is_deleted_by_admin && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Postingan Dihapus oleh Admin: &quot;{t.admin_delete_reason || "Pelanggaran tata tertib"}&quot;</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!t.is_deleted_by_admin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus oleh Admin</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setUserToSuspend({ id: t.author_id, name: t.author_name, email: t.author_email })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>Suspend Penulis</span>
                    </button>
                  </div>
                </div>
              </div>
              );
        })}
            </div>

      {
            userToSuspend && (
              <SuspendUserModal
                isOpen={Boolean(userToSuspend)}
                onClose={() => setUserToSuspend(null)}
                userId={userToSuspend.id}
                userName={userToSuspend.name}
                userEmail={userToSuspend.email}
                onConfirm={onSuspendUser}
                isLoading={isLoading}
              />
            )
          }
    </div>
      );
}

