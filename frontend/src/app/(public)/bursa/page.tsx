"use client";

import React, { useState } from "react";
import { usePublicCampaigns } from "@/hooks/use-campaigns";
import { CampaignCard } from "@/components/domain/bursa/CampaignCard";
import { Search, TrendingUp } from "lucide-react";

export default function BursaCatalogPage() {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 border-b border-[#E2E7EB] dark:border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
            Katalog Usaha &amp; Penjualan Saham
          </h1>
          <p className="text-xs text-[#516072] dark:text-slate-400 mt-1">
            Pilih usaha potensial, pelajari prospektus SAK EMKM, dan beli porsi saham kepemilikan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#516072] dark:text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama usaha atau judul..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 border border-[#E2E7EB] rounded-xl text-xs bg-white dark:border-white/[0.08] dark:bg-[#132235] text-[#0F1E2E] dark:text-white outline-none focus:border-[#1D5FAE]"
            />
          </div>

          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            className="px-3.5 py-2 border border-[#E2E7EB] rounded-xl text-xs bg-white dark:border-white/[0.08] dark:bg-[#132235] text-[#0F1E2E] dark:text-slate-300 outline-none focus:border-[#1D5FAE]"
          >
            <option value="">Semua Skema</option>
            <option value="micro_equity">Mikro-Ekuitas (Saham)</option>
            <option value="revenue_sharing">Bagi Hasil</option>
          </select>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="px-3.5 py-2 border border-[#E2E7EB] rounded-xl text-xs bg-white dark:border-white/[0.08] dark:bg-[#132235] text-[#0F1E2E] dark:text-slate-300 outline-none focus:border-[#1D5FAE]"
          >
            <option value="">Semua Sektor</option>
            <option value="F&B">Kuliner (F&B)</option>
            <option value="Retail">Retail &amp; Toko</option>
            <option value="Jasa">Jasa &amp; Layanan</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 rounded-[18px] border border-[#E2E7EB] dark:border-white/[0.08] bg-white/60 dark:bg-[#132235]/40 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="stitch-card p-12 text-center border-dashed">
          <TrendingUp className="h-8 w-8 text-[#516072] opacity-40 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0F1E2E] dark:text-white">
            Tidak Ada Usaha yang Cocok
          </h3>
          <p className="text-xs text-[#516072] dark:text-slate-400 mt-1">
            Coba ubah kata kunci pencarian atau reset filter sektor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
