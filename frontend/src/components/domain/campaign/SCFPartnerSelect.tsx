"use client";

import React from "react";
import { useSCFPartners } from "@/hooks/use-ojk";
import { ShieldCheck, ExternalLink } from "lucide-react";

interface SCFPartnerSelectProps {
  selectedId: string;
  onSelect: (id: string) => void;
  ojkCode: string;
  onCodeChange: (code: string) => void;
}

export function SCFPartnerSelect({
  selectedId,
  onSelect,
  ojkCode,
  onCodeChange,
}: SCFPartnerSelectProps) {
  const { data: partners = [] } = useSCFPartners();

  const selectedPartner = partners.find((p) => p.id === selectedId);

  return (
    <div className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-50/50 p-3.5 dark:bg-blue-950/20">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-200">
          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Penyelenggara SCF Berizin OJK (POJK 17/2025)
        </label>
        {selectedPartner?.website_url && (
          <a
            href={selectedPartner.website_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
          >
            Profil Penyelenggara
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-[#121827] dark:text-slate-100"
          >
            <option value="">Pilih Penyelenggara SCF...</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand_name} ({p.license_number || "Berizin OJK"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="text"
            value={ojkCode}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="No. Registrasi Efek / SK OJK (opsional)"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-[#121827] dark:text-slate-100"
          />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Sesuai regulasi POJK No. 17 Tahun 2025, penawaran saham publik UMKM terafiliasi dengan penyelenggara resmi berizin OJK untuk menjamin kepatuhan pasar modal.
      </p>
    </div>
  );
}

