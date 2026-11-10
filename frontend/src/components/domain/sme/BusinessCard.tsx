"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, AlertTriangle, Lock } from "lucide-react";
import type { SMEItem } from "@/hooks/use-sme-list";

interface BusinessCardProps {
  biz: SMEItem;
  isActive: boolean;
  onSelect: (id: string, name: string) => void;
}

export function BusinessCard({ biz, isActive, onSelect }: BusinessCardProps) {
  const isSuspended = Boolean(biz.is_suspended);

  return (
    <div
      className={`rounded-[18px] border p-5 transition-all flex flex-col justify-between ${isSuspended
          ? "border-rose-300 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/20 shadow-xs"
          : isActive
            ? "border-[#1D5FAE] bg-[#DFE9F1]/30 dark:bg-blue-950/20 shadow-xs"
            : "border-[#E2E7EB] dark:border-white/[0.08] bg-white dark:bg-[#132235] hover:border-slate-300 dark:hover:border-white/20"
        }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F4F3F1] dark:bg-white/10 text-[#516072] dark:text-slate-300">
                {biz.sector || "Umum"}
              </span>
              {biz.is_incorporated_pt && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/50 dark:text-blue-300">
                  PT Resmi
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F1E2E] dark:text-white mt-2">
              {biz.business_name}
            </h3>
            {biz.description && (
              <p className="text-xs text-[#516072] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {biz.description}
              </p>
            )}
          </div>

          {isSuspended ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/80 border border-rose-300/80 dark:border-rose-800 px-2.5 py-1 rounded-full shrink-0">
              <AlertTriangle className="h-3.5 w-3.5" /> Ditangguhkan
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D5FAE] dark:text-blue-300 bg-[#DFE9F1] dark:bg-blue-950/60 px-2.5 py-1 rounded-full shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
            </span>
          ) : null}
        </div>

        {isSuspended && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Bisnis Ini Ditangguhkan oleh Admin</span>
            </div>
            <p className="text-[11px] text-rose-600/90 dark:text-rose-400 leading-relaxed">
              {biz.suspension_reason
                ? `Alasan: "${biz.suspension_reason}"`
                : "Operasional kasir POS dan bursa saham dinonaktifkan sementara karena sanksi pelanggaran."}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-[#516072] dark:text-slate-400 border-t border-[#E2E7EB] dark:border-white/[0.06] pt-3">
          <div>
            <span className="block text-[10px] text-[#66727F] dark:text-slate-400">Skor Kesiapan</span>
            <span className="font-bold text-[#0F1E2E] dark:text-white tabular-nums">
              {biz.digital_readiness_score ? `${biz.digital_readiness_score}/100` : "Belum Dinilai"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#66727F] dark:text-slate-400">Status Operasional</span>
            <span
              className={`font-bold ${isSuspended ? "text-rose-600 dark:text-rose-400" : "text-[#0F1E2E] dark:text-white"
                }`}
            >
              {isSuspended ? "Ditangguhkan" : "Aktif Normal"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#E2E7EB] dark:border-white/[0.06] flex items-center justify-between gap-2">
        {isSuspended ? (
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Akses Dinonaktifkan</span>
          </span>
        ) : !isActive ? (
          <button
            type="button"
            onClick={() => onSelect(biz.id, biz.business_name)}
            className="px-3 py-1.5 rounded-lg border border-[#1D5FAE]/40 text-[#1D5FAE] dark:text-blue-300 text-xs font-semibold hover:bg-[#DFE9F1]/50 dark:hover:bg-blue-950/30 transition"
          >
            Pilih Bisnis Ini
          </button>
        ) : (
          <span className="text-xs font-medium text-[#66727F] dark:text-slate-400">Sedang Dipilih</span>
        )}

        <Link
          href={`/sme/bisnis/${biz.id}`}
          onClick={() => {
            if (!isSuspended) onSelect(biz.id, biz.business_name);
          }}
          className={`inline-flex items-center gap-1.5 rounded-[11px] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition ${
            isSuspended ? "bg-rose-600 hover:bg-rose-700" : "bg-[#1D5FAE] hover:bg-[#184e91]"
          }`}
        >
          <span>{isSuspended ? "Status Sanksi" : "Detail Bisnis"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div >
  );
}
