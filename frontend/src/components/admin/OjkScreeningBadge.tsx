"use client";

import React, { useState } from "react";
import { useSMEScreening } from "@/hooks/use-ojk";
import { ShieldCheck, AlertTriangle, X } from "lucide-react";

interface OjkScreeningBadgeProps {
  smeId: string;
}

export function OjkScreeningBadge({ smeId }: OjkScreeningBadgeProps) {
  const { data: screening, isLoading } = useSMEScreening(smeId);
  const [openModal, setOpenModal] = useState(false);

  if (isLoading) {
    return <span className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse inline-block" />;
  }

  if (!screening) {
    return null;
  }

  const isFlagged = screening.is_flagged;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenModal(true)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
          isFlagged
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
        }`}
      >
        {isFlagged ? (
          <>
            <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
            <span>Terindikasi SWI</span>
          </>
        ) : (
          <>
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Bersih SWI</span>
          </>
        )}
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-left">
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#121827]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isFlagged ? "bg-rose-100 dark:bg-rose-950/60" : "bg-emerald-100 dark:bg-emerald-950/60"
                  }`}
                >
                  {isFlagged ? (
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Audit Skrining Entitas OJK / SWI
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pencegahan Fraud &amp; Investasi Ilegal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900/50">
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-white/5">
                <span className="text-slate-500">Nama Bisnis:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{screening.business_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-white/5">
                <span className="text-slate-500">Nama Pemilik:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{screening.owner_name || "-"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Tingkat Risiko:</span>
                <span
                  className={`font-bold ${
                    isFlagged ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {screening.risk_level === "HIGH" ? "TINGGI (Terindikasi)" : "RENDAH (Bersih)"}
                </span>
              </div>
            </div>

            {isFlagged && screening.matched_illegals && screening.matched_illegals.length > 0 && (
              <div className="space-y-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-800 dark:text-rose-200">
                <div className="font-bold text-[11px]">Kecocokan Entitas Blacklist SWI:</div>
                {screening.matched_illegals.map((m) => (
                  <div key={m.id} className="rounded bg-white/70 p-1.5 text-[10px] dark:bg-black/30">
                    <span className="font-bold">{m.entity_name}</span> &bull; {m.activity_type}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

