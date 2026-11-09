"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { usePublicCampaign } from "@/hooks/use-campaigns";
import { useValuationHistory, useBoardroomAccess } from "@/hooks/use-bursa-trading";
import { usePortfolio } from "@/hooks/use-invest";
import { BursaChartTab } from "@/components/domain/bursa/BursaChartTab";
import { BursaDocumentTab } from "@/components/domain/bursa/BursaDocumentTab";
import { BursaBoardroomTab } from "@/components/domain/bursa/BursaBoardroomTab";
import { BursaExchangeWidget } from "@/components/domain/bursa/BursaExchangeWidget";
import { LineChart, FileText, Lock, ShieldCheck } from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { data: campaign, isLoading, error } = usePublicCampaign(slug);
  const { data: valHistory } = useValuationHistory(slug);
  const { data: access } = useBoardroomAccess(slug);
  const { data: portfolio } = usePortfolio();
  const [activeTab, setActiveTab] = useState<"chart" | "docs" | "boardroom">("chart");

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl space-y-6">
        <div className="h-10 w-1/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-72 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Kampanye UMKM tidak ditemukan atau telah berakhir.
      </div>
    );
  }

  const remaining = Math.max(0, campaign.target_amount_idr - campaign.raised_amount_idr);
  const curPrice = valHistory?.current_price_idr || campaign.min_investment_idr || 1000;
  const userOwnedAmount = (portfolio ?? [])
    .filter((p) => p.campaign_slug === campaign.slug && p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount_idr, 0);
  const hasShareholderAccess = Boolean(access?.can_access || userOwnedAmount > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
            <span className="font-semibold uppercase text-blue-500 px-2.5 py-0.5 bg-blue-500/10 rounded-full">
              {campaign.sector}
            </span>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
              Terdaftar di UHUI
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">{campaign.business_name}</span>
            {campaign.is_incorporated_pt && (
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                PT Terverifikasi
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {campaign.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("chart")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${activeTab === "chart"
            ? "bg-slate-100 dark:bg-slate-800 text-blue-500 shadow-sm"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
        >
          <LineChart className="h-4 w-4" />
          <span>Nilai Aset &amp; Trading</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${activeTab === "docs"
            ? "bg-slate-100 dark:bg-slate-800 text-blue-500 shadow-sm"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
        >
          <FileText className="h-4 w-4" />
          <span>Dokumen Keuangan SAK EMKM</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("boardroom")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${activeTab === "boardroom"
            ? "bg-slate-100 dark:bg-slate-800 text-blue-500 shadow-sm"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
        >
          {hasShareholderAccess ? <ShieldCheck className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4" />}
          <span>Ruang Rapat Pemegang Saham</span>
        </button>
      </div>

      {activeTab === "chart" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BursaChartTab
              points={valHistory?.points}
              currentPrice={curPrice}
              changeBps={valHistory?.change_bps || 600}
              businessName={campaign.business_name}
              description={campaign.description}
              minInvestmentIdr={campaign.min_investment_idr}
              returnShareBps={campaign.return_share_bps}
              termMonths={campaign.term_months}
              targetAmountIdr={campaign.target_amount_idr}
              raisedAmountIdr={campaign.raised_amount_idr}
              remainingAmountIdr={remaining}
            />
          </div>
          <div>
            <BursaExchangeWidget
              campaignId={campaign.id || campaign.slug}
              currentPrice={curPrice}
              hasAccess={hasShareholderAccess}
              investmentAmount={userOwnedAmount}
              remainingAmount={remaining}
              onOpenBoardroom={() => setActiveTab("boardroom")}
            />
          </div>
        </div>
      )}

      {activeTab === "docs" && (
        <BursaDocumentTab campaignSlug={slug} businessName={campaign.business_name} isPt={campaign.is_incorporated_pt} sector={campaign.sector} />
      )}

      {activeTab === "boardroom" && (
        <BursaBoardroomTab campaignSlug={slug} businessName={campaign.business_name} hasConfirmedAccess={hasShareholderAccess} onOpenTradingModal={() => setActiveTab("chart")} />
      )}
    </div>
  );
}
