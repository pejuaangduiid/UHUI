"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import type { SMEItem } from "@/hooks/use-sme-list";

interface BusinessCardProps {
  biz: SMEItem;
  isActive: boolean;
  onSelect: (id: string, name: string) => void;
}

export function BusinessCard({ biz, isActive, onSelect }: BusinessCardProps) {
  return (
    <div
      className={`rounded-[18px] border p-5 transition-all flex flex-col justify-between ${isActive
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

          {isActive && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D5FAE] dark:text-blue-300 bg-[#DFE9F1] dark:bg-blue-950/60 px-2.5 py-1 rounded-full shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-[#516072] dark:text-slate-400 border-t border-[#E2E7EB] dark:border-white/[0.06] pt-3">
          <div>
            <span className="block text-[10px] text-[#66727F] dark:text-slate-400">Skor Kesiapan</span>
            <span className="font-bold text-[#0F1E2E] dark:text-white tabular-nums">
              {biz.digital_readiness_score ? `${biz.digital_readiness_score}/100` : "Belum Dinilai"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#66727F] dark:text-slate-400">Status Bursa</span>
            <span className="font-bold text-[#0F1E2E] dark:text-white">
              {biz.is_listed_on_bursa ? "Terdaftar" : "Belum Listing"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#E2E7EB] dark:border-white/[0.06] flex items-center justify-between gap-2">
        {!isActive ? (
          <button
            type="button"
            onClick={() => onSelect(biz.id, biz.business_name)}
            className="px-3 py-1.5 rounded-lg border border-[#1D5FAE]/40 text-[#1D5FAE] dark:text-blue-300 text-xs font-semibold hover:bg-[#DFE9F1]/50 dark:hover:bg-blue-950/30 transition"
          >
            Pilih Bisnis Ini
          </button>
        ) : (
          <span className="text-xs font-medium text-[#66727F] dark:text-slate-400">Sedang Aktif</span>
        )}

        <Link
          href={`/sme/bisnis/${biz.id}`}
          onClick={() => onSelect(biz.id, biz.business_name)}
          className="inline-flex items-center gap-1.5 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition"
        >
          <span>Detail Bisnis</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
