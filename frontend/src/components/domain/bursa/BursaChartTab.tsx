"use client";

import React from "react";
import { TradingChart, type TradingPoint } from "./TradingChart";
import { ReturnSimulator } from "./ReturnSimulator";
import { BursaAiTipsCard } from "./BursaAiTipsCard";
import { formatIDR } from "@/lib/money";

interface BursaChartTabProps {
  points?: TradingPoint[] | null;
  currentPrice: number;
  changeBps: number;
  businessName: string;
  description: string;
  minInvestmentIdr: number;
  returnShareBps: number;
  termMonths: number;
  targetAmountIdr: number;
  raisedAmountIdr: number;
  remainingAmountIdr: number;
}

export function BursaChartTab({
  points,
  currentPrice,
  changeBps,
  businessName,
  description,
  minInvestmentIdr,
  returnShareBps,
  termMonths,
  targetAmountIdr,
  raisedAmountIdr,
  remainingAmountIdr,
}: BursaChartTabProps) {
  return (
    <div className="space-y-6">
      <TradingChart
        points={points}
        currentPrice={currentPrice}
        changeBps={changeBps}
        businessName={businessName}
      />

      <BursaAiTipsCard
        businessName={businessName}
        currentPrice={currentPrice}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#131926]/90 backdrop-blur-md">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Tentang Usaha &amp; Rencana Bisnis</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description || "UMKM ini terintegrasi penuh dengan ekosistem pembukuan kasir digital UHUI dan standar akuntansi SAK EMKM."}
            </p>
          </div>
          <ReturnSimulator
            initialAmount={minInvestmentIdr}
            returnShareBps={returnShareBps}
            termMonths={termMonths}
            targetAmountIdr={targetAmountIdr}
          />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#131926]/90 backdrop-blur-md space-y-3 h-fit">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Ringkasan Penawaran Saham</h4>
          <div className="space-y-2 text-xs border-y border-slate-100 dark:border-white/[0.05] py-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Modal</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatIDR(targetAmountIdr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Modal Terserap</span>
              <span className="font-bold text-[#1D5FAE] dark:text-blue-400">{formatIDR(raisedAmountIdr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sisa Kuota Saham</span>
              <span className="font-bold text-blue-500">{formatIDR(remainingAmountIdr)}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Penawaran ini disupervisi dalam koridor literasi &amp; simulasi pasar mikro-ekuitas UMKM.
          </p>
        </div>
      </div>
    </div>
  );
}
