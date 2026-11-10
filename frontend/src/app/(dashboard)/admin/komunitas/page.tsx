"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, UserX } from "lucide-react";
import { useAdminCommunity } from "@/hooks/use-admin-community";
import { AdminThreadModerationList } from "@/components/admin/AdminThreadModerationList";
import { SuspendedUsersTable } from "@/components/admin/SuspendedUsersTable";

export default function AdminKomunitasPage() {
  const [activeTab, setActiveTab] = useState<"threads" | "suspended">("threads");
  const {
    threads,
    suspendedUsers,
    isLoading,
    deleteThread,
    suspendUser,
    unsuspendUser,
  } = useAdminCommunity();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#1D5FAE] mb-1 transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Ringkasan Superadmin</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Moderasi Komunitas &amp; Sanksi Pengguna
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hapus postingan melanggar aturan dan berikan sanksi penangguhan akses akun (1 jam hingga permanen).
            </p>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#121827]">
          <button
            type="button"
            onClick={() => setActiveTab("threads")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === "threads"
                  ? "bg-[#1D5FAE] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Moderasi Postingan ({threads.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suspended")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === "suspended"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
          >
            <UserX className="h-3.5 w-3.5" />
            <span>Pengguna Ditangguhkan ({suspendedUsers.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "threads" ? (
        <AdminThreadModerationList
          threads={threads}
          isLoading={isLoading || deleteThread.isPending || suspendUser.isPending}
          onDeleteThread={async (id, reason) => {
            await deleteThread.mutateAsync({ id, reason });
          }}
          onSuspendUser={async (userId, durationHours, reason) => {
            await suspendUser.mutateAsync({ id: userId, input: { duration_hours: durationHours, reason } });
          }}
        />
      ) : (
        <SuspendedUsersTable
          users={suspendedUsers}
          isLoading={isLoading || unsuspendUser.isPending}
          onUnsuspend={async (id) => {
            await unsuspendUser.mutateAsync(id);
          }}
        />
      )}
    </div>
  );
}

