"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { SuspendEntityModal } from "./SuspendEntityModal";
import type { components } from "@/types/api";

type SMEAdminDTO = components["schemas"]["SMEAdminDTO"];

interface AdminSMETableProps {
  items: SMEAdminDTO[];
  onToggleSuspend: (id: string, isSuspended: boolean, reason?: string) => Promise<void>;
  isLoading: boolean;
}

export function AdminSMETable({ items, onToggleSuspend, isLoading }: AdminSMETableProps) {
  const [selectedSME, setSelectedSME] = useState<SMEAdminDTO | null>(null);
  const [search, setSearch] = useState("");

  const filtered = items.filter((sme) =>
    sme.business_name.toLowerCase().includes(search.toLowerCase()) ||
    sme.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    sme.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari bisnis UMKM, nama pemilik, atau sektor..."
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-[#1D5FAE] dark:border-white/10 dark:bg-[#121827] dark:text-white"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400">Total: {filtered.length} UMKM</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-400 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <tr>
              <th className="py-3 px-4 font-semibold">Nama Bisnis &amp; Sektor</th>
              <th className="py-3 px-4 font-semibold">Pemilik Akun</th>
              <th className="py-3 px-4 font-semibold">Bursa &amp; Skor</th>
              <th className="py-3 px-4 font-semibold">Status Operasional</th>
              <th className="py-3 px-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filtered.map((sme) => (
              <tr key={sme.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900 dark:text-white">{sme.business_name}</div>
                  <div className="text-[11px] text-slate-400">{sme.sector} &bull; {sme.is_incorporated_pt ? "PT" : "Perorangan"}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800 dark:text-slate-200">{sme.owner_name}</div>
                  <div className="text-[11px] text-slate-400">{sme.owner_email}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{sme.digital_readiness_score ?? 0} Poin</span>
                    {sme.is_listed_on_bursa && (
                      <span className="text-[10px] font-bold text-[#1D5FAE] bg-[#DFE9F1] dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.5 rounded">Bursa</span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {sme.is_suspended ? (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <AlertTriangle className="h-3 w-3" /> Ditangguhkan
                      </span>
                      {sme.suspension_reason && (
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{sme.suspension_reason}</div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300">
                      <CheckCircle className="h-3 w-3" /> Aktif Normal
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedSME(sme)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${sme.is_suspended
                        ? "bg-[#DFE9F1] text-[#1D5FAE] hover:bg-[#c9dbe9] dark:bg-blue-950/60 dark:text-blue-300"
                        : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                      }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>{sme.is_suspended ? "Aktifkan" : "Suspend"}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSME && (
        <SuspendEntityModal
          isOpen={Boolean(selectedSME)}
          onClose={() => setSelectedSME(null)}
          title={selectedSME.is_suspended ? "Aktifkan Kembali Bisnis" : "Penangguhan Bisnis UMKM"}
          entityName={selectedSME.business_name}
          isCurrentlySuspended={selectedSME.is_suspended}
          onConfirm={(isSuspended, reason) => onToggleSuspend(selectedSME.id, isSuspended, reason)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

