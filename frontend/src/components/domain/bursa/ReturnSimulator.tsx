"use client";

import React, { useState } from "react";
import { formatIDR, floorDivBig } from "@/lib/money";

interface ReturnSimulatorProps {
  initialAmount?: number;
  returnShareBps?: number;
  termMonths?: number;
  targetAmountIdr?: number;
}

export function ReturnSimulator({
  initialAmount = 1_000_000,
  returnShareBps = 1500,
  termMonths = 12,
  targetAmountIdr = 50_000_000,
}: ReturnSimulatorProps) {
  const [investAmount, setInvestAmount] = useState(initialAmount);
  const [estMonthlyProfit, setEstMonthlyProfit] = useState(15_000_000);

  const numerator =
    BigInt(estMonthlyProfit) * BigInt(returnShareBps) * BigInt(investAmount);
  const denominator = BigInt(10_000) * BigInt(targetAmountIdr || 1);
  const estMonthlyPayout =
    denominator > BigInt(0) ? Number(floorDivBig(numerator, denominator)) : 0;
  const estTotalReturn = estMonthlyPayout * termMonths;
  const netGain = estTotalReturn;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Kalkulator Simulasi ROI</h3>
        <span className="text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
          Hanya Estimasi
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
            Nominal Rencana Investasi:
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={100_000}
              step={100_000}
              value={investAmount}
              onChange={(e) => setInvestAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 dark:border-white/[0.08] dark:bg-[#151c2e] text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
            <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatIDR(investAmount)}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {[500_000, 1_000_000, 5_000_000, 10_000_000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setInvestAmount(val)}
                className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all font-semibold ${investAmount === val
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25"
                  : "border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
              >
                {formatIDR(val)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
            Asumsi Laba Bersih Bulanan UMKM:
          </label>
          <input
            type="number"
            min={1_000_000}
            step={1_000_000}
            value={estMonthlyProfit}
            onChange={(e) => setEstMonthlyProfit(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 dark:border-white/[0.08] dark:bg-[#151c2e] text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
          <span className="text-xs font-medium text-slate-400 mt-1 block">
            {formatIDR(estMonthlyProfit)} / bulan
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4.5 space-y-2.5 text-xs dark:border-white/[0.06] dark:bg-[#151c2e]">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Bagi Hasil / Dividen:</span>
          <span className="font-bold text-slate-900 dark:text-white">{`${(returnShareBps / 100).toFixed(2)}% dari Laba`}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Tenor Kontrak:</span>
          <span className="font-bold text-slate-900 dark:text-white">{`${termMonths} Bulan`}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 dark:border-white/[0.06] pt-2.5">
          <span className="text-slate-500 dark:text-slate-400">Estimasi Bagi Hasil / Bln:</span>
          <span className="font-extrabold text-blue-500">{formatIDR(estMonthlyPayout)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">{`Total Dividen ${termMonths} Bln:`}</span>
          <span className="font-extrabold text-[#1D5FAE] dark:text-blue-400">{formatIDR(netGain)}</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-normal">
        * Angka ini merupakan proyeksi matematis simulasi edukasi berdasarkan asumsi laba bersih. Hasil riil bergantung pada kinerja operasional aktual UMKM.
      </p>
    </div>
  );
}
