"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { formatIDR } from "@/lib/money";
import { SuspendEntityModal } from "./SuspendEntityModal";
import type { components } from "@/types/api";

type CampaignAdminDTO = components["schemas"]["CampaignAdminDTO"];

interface AdminCampaignTableProps {
  items: CampaignAdminDTO[];
  onToggleSuspend: (id: string, isSuspended: boolean, reason?: string) => Promise<void>;
  isLoading: boolean;
}

export function AdminCampaignTable({ items, onToggleSuspend, isLoading }: AdminCampaignTableProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignAdminDTO | null>(null);
  const [search, setSearch] = useState("");

  const filtered = items.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.business_name.toLowerCase().includes(search.toLowerCase()) ||
    c.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul kampanye, bisnis, atau pemilik..."
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-[#1D5FAE] dark:border-white/10 dark:bg-[#121827] dark:text-white"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400">Total: {filtered.length} Kampanye</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-400 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <tr>
              <th className="py-3 px-4 font-semibold">Judul Kampanye &amp; Penerbit</th>
              <th className="py-3 px-4 font-semibold">Skema &amp; Target</th>
              <th className="py-3 px-4 font-semibold">Terkumpul</th>
              <th className="py-3 px-4 font-semibold">Status Pasar</th>
              <th className="py-3 px-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900 dark:text-white">{c.title}</div>
                  <div className="text-[11px] text-slate-400">{c.business_name} &bull; {c.sector}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800 dark:text-slate-200">{formatIDR(c.target_amount_idr)}</div>
                  <div className="text-[11px] text-slate-400 capitalize">{c.scheme.replace("_", " ")}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#1D5FAE] dark:text-blue-400">{formatIDR(c.raised_amount_idr)}</div>
                  <div className="text-[10px] text-slate-400">
                    {c.target_amount_idr > 0 ? Math.round((c.raised_amount_idr / c.target_amount_idr) * 100) : 0}% Terpenuhi
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {c.is_suspended ? (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <AlertTriangle className="h-3 w-3" /> Ditangguhkan
                      </span>
                      {c.suspension_reason && (
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{c.suspension_reason}</div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300 uppercase">
                      <CheckCircle className="h-3 w-3" /> {c.status}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedCampaign(c)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${c.is_suspended
                        ? "bg-[#DFE9F1] text-[#1D5FAE] hover:bg-[#c9dbe9] dark:bg-blue-950/60 dark:text-blue-300"
                        : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                      }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>{c.is_suspended ? "Aktifkan" : "Suspend"}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCampaign && (
        <SuspendEntityModal
          isOpen={Boolean(selectedCampaign)}
          onClose={() => setSelectedCampaign(null)}
          title={selectedCampaign.is_suspended ? "Aktifkan Kembali Kampanye" : "Penangguhan Kampanye Bursa"}
          entityName={selectedCampaign.title}
          isCurrentlySuspended={selectedCampaign.is_suspended}
          onConfirm={(isSuspended, reason) => onToggleSuspend(selectedCampaign.id, isSuspended, reason)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

