"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, PlusCircle, Store, Briefcase } from "lucide-react";
import { BursaCatalogSection } from "@/components/domain/bursa/BursaCatalogSection";
import { UserPortfolioSection } from "@/components/domain/bursa/UserPortfolioSection";
import { OjkLegalityChecker } from "@/components/domain/bursa/OjkLegalityChecker";
import { WalletBadge } from "@/components/domain/wallet/WalletBadge";
import { usePortfolio } from "@/hooks/use-invest";

export default function BursaSahamDashboardPage() {
  const [activeTab, setActiveTab] = useState<"katalog" | "portofolio">("katalog");
  const { data: items } = usePortfolio();
  const ownedCount = items?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-[#E2E7EB] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
              Bursa Saham &amp; Pasar Ekuitas
            </h1>
            <span className="text-[11px] font-bold bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300 border border-[#B9C8DD] dark:border-blue-900/40 px-2.5 py-0.5 rounded-full">
              Simulasi Saham SAK EMKM
            </span>
          </div>
          <p className="text-xs text-[#516072] dark:text-slate-400 mt-1">
            Eksplorasi penawaran saham usaha mikro, pantau dividen portofolio Anda, dan berinteraksi di ruang rapat pemegang saham.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <WalletBadge />
          <Link
            href="/sme/ruang-rapat"
            className="inline-flex items-center gap-2 bg-[#1D5FAE] hover:bg-[#184e91] text-white px-4 py-2 rounded-[11px] text-xs font-semibold transition shadow-xs active:scale-[0.985]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Ruang Rapat Pemegang Saham</span>
          </Link>

          <Link
            href="/sme/kampanye"
            className="inline-flex items-center gap-1.5 border border-[#0F1E2E] dark:border-white/20 text-[#0F1E2E] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] px-4 py-2 rounded-[11px] text-xs font-semibold transition active:scale-[0.985]"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Jual Saham Usaha</span>
          </Link>
        </div>
      </div>

      {/* Tab Segmented Control (Screen 21 vs Screen 22) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F4F3F1] dark:bg-[#101E2E] border border-[#E2E7EB] dark:border-white/[0.08] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("katalog")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "katalog"
              ? "bg-white dark:bg-[#172940] text-[#1D5FAE] dark:text-blue-300 shadow-xs font-bold"
              : "text-[#516072] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white"
            }`}
        >
          <Store className="h-3.5 w-3.5" />
          <span>Katalog Penjualan Saham</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("portofolio")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "portofolio"
              ? "bg-white dark:bg-[#172940] text-[#1D5FAE] dark:text-blue-300 shadow-xs font-bold"
              : "text-[#516072] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white"
            }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>Saham Saya &amp; Portofolio</span>
          {ownedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#DFE9F1] dark:bg-blue-950 text-[#1D5FAE] dark:text-blue-300 font-bold">
              {ownedCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "katalog" ? (
        <div className="space-y-6">
          <BursaCatalogSection />
          <OjkLegalityChecker />
        </div>
      ) : (
        <div className="space-y-6">
          <UserPortfolioSection onExplore={() => setActiveTab("katalog")} />
          <OjkLegalityChecker />
        </div>
      )}
    </div>
  );
}
