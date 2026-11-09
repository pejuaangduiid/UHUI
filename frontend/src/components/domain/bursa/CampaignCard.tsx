import React from "react";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";
import { formatIDR } from "@/lib/money";
import { CheckCircle2, TrendingUp } from "lucide-react";
import type { components } from "@/types/api";

type Campaign = components["schemas"]["PublicCampaignDTO"];

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const returnPercent = (campaign.return_share_bps / 100).toFixed(2);
  const isEquity = campaign.scheme === "micro_equity";
  const schemeLabel = isEquity ? "Mikro-Ekuitas" : "Bagi Hasil";

  return (
    <div className="stitch-card p-5 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1D5FAE] bg-[#DFE9F1] dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
              {campaign.sector || "UMKM"}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1D5FAE] bg-[#DFE9F1] dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" />
              <span>Terdaftar di UHUI</span>
            </span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-[#F4F3F1] text-[#516072] dark:bg-white/10 dark:text-slate-300">
            {schemeLabel}
          </span>
        </div>

        <h3 className="font-bold text-base sm:text-lg text-[#0F1E2E] dark:text-white line-clamp-1 mb-1" title={campaign.title}>
          {campaign.title}
        </h3>
        <p className="text-xs text-[#516072] dark:text-slate-400 mb-4 line-clamp-1">
          {campaign.business_name}
          {campaign.is_incorporated_pt && (
            <span className="ml-1.5 text-[10px] font-bold bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded">
              PT
            </span>
          )}
        </p>

        <div className="flex items-center justify-between text-[11px] text-[#516072] dark:text-slate-400 mb-1">
          <span className="inline-flex items-center gap-1 text-[#1D5FAE] dark:text-blue-400 font-semibold">
            <TrendingUp className="h-3 w-3" />
            <span>Pelepasan Saham: {returnPercent}%</span>
          </span>
          <span className="tabular-nums">Target: {formatIDR(campaign.target_amount_idr)}</span>
        </div>

        <ProgressBar
          raisedAmountIdr={campaign.raised_amount_idr}
          targetAmountIdr={campaign.target_amount_idr}
          className="mb-4"
        />

        <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E2E7EB] dark:border-white/[0.06] text-center text-xs mb-4">
          <div>
            <div className="text-[#66727F] dark:text-slate-400 text-[11px]">{isEquity ? "Porsi Saham" : "Bagi Hasil"}</div>
            <div className="font-bold text-[#0F1E2E] dark:text-white mt-0.5 tabular-nums">{`${returnPercent}%`}</div>
          </div>
          <div>
            <div className="text-[#66727F] dark:text-slate-400 text-[11px]">Tenor</div>
            <div className="font-bold text-[#0F1E2E] dark:text-white mt-0.5">
              {`${campaign.term_months} Bln`}
            </div>
          </div>
          <div>
            <div className="text-[#66727F] dark:text-slate-400 text-[11px]">Kesiapan</div>
            <div className="font-bold text-[#1D5FAE] dark:text-blue-400 mt-0.5">
              {`${campaign.latest_readiness_score || "-"}/100`}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs">
          <span className="text-[#66727F] dark:text-slate-400 block text-[10px]">Min. Beli Saham</span>
          <span className="font-bold text-[#0F1E2E] dark:text-white tabular-nums">{formatIDR(campaign.min_investment_idr)}</span>
        </div>

        <Link
          href={`/bursa/${campaign.slug}`}
          className="text-xs font-semibold bg-[#1D5FAE] hover:bg-[#184e91] text-white px-3.5 py-2 rounded-[11px] transition shadow-xs active:scale-[0.985]"
        >
          Beli Saham &amp; Prospektus
        </Link>
      </div>
    </div>
  );
}
