"use client";

import React from "react";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import type { components } from "@/types/api";

type SuspendedUserDTO = components["schemas"]["SuspendedUserDTO"];

interface SuspendedUsersTableProps {
  users: SuspendedUserDTO[];
  onUnsuspend: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function SuspendedUsersTable({ users, onUnsuspend, isLoading }: SuspendedUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#121827]">
        <CheckCircle2 className="h-6 w-6 text-[#1D5FAE] mx-auto mb-2 opacity-80" />
        <span className="font-semibold block">Tidak ada akun yang sedang ditangguhkan.</span>
        <span>Seluruh pengguna komunitas beroperasi dalam status normal.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-400 dark:border-white/[0.05] dark:bg-white/[0.02]">
          <tr>
            <th className="py-3 px-4 font-semibold">Nama &amp; Email Pengguna</th>
            <th className="py-3 px-4 font-semibold">Peran Akun</th>
            <th className="py-3 px-4 font-semibold">Berakhir Pada</th>
            <th className="py-3 px-4 font-semibold">Alasan Penangguhan</th>
            <th className="py-3 px-4 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {users.map((u) => {
            const until = new Date(u.suspended_until);
            const isPerm = until.getFullYear() > 2100;
            return (
              <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900 dark:text-white">{u.full_name}</div>
                  <div className="text-[11px] text-slate-400">{u.email}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase">
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{isPerm ? "Permanen" : until.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xs">
                    {u.suspension_reason || "Pelanggaran tata tertib komunitas"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onUnsuspend(u.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#DFE9F1] text-[#1D5FAE] hover:bg-[#c9dbe9] dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 transition disabled:opacity-50"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Cabut Sanksi (Unsuspend)</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

