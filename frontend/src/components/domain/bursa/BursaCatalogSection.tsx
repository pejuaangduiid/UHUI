"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { usePublicCampaigns } from "@/hooks/use-campaigns";
import { CampaignCard } from "./CampaignCard";

export function BursaCatalogSection() {
  const [scheme, setScheme] = useState("");
  const [sector, setSector] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: campaigns, isLoading } = usePublicCampaigns({
    scheme,
    sector,
    limit: 50,
  });

  const filtered = (campaigns ?? []).filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      c.business_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari usaha, brand, atau nama kampanye..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#0b0f19] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="">Semua Skema</option>
            <option value="micro_equity">Mikro-Ekuitas (Saham)</option>
            <option value="revenue_sharing">Bagi Hasil</option>
          </select>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="">Semua Sektor</option>
            <option value="F&B">Kuliner (F&B)</option>
            <option value="Retail">Retail &amp; Toko</option>
            <option value="Jasa">Jasa &amp; Layanan</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-slate-200/50 bg-slate-100/50 dark:border-white/5 dark:bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white dark:border-white/10 dark:bg-[#121827] text-slate-500 dark:text-slate-400 text-xs space-y-2">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Tidak ada usaha yang cocok dengan filter Anda.</p>
          <p>Coba pilih filter lain atau gunakan kata kunci pencarian yang berbeda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((camp) => (
            <CampaignCard key={camp.slug} campaign={camp} />
          ))}
        </div>
      )}
    </div>
  );
}

