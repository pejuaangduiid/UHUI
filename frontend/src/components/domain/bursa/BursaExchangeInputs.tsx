"use client";

import React from "react";
import { formatIDR } from "@/lib/money";

interface BursaExchangeInputsProps {
  mode: "buy" | "sell";
  shares: number;
  unitPrice: number;
  sharesOwned: number;
  maxBuyShares: number;
  remainingAmount: number;
  investmentAmount: number;
  onSharesChange: (shares: number) => void;
}

export function BursaExchangeInputs({
  mode,
  shares,
  unitPrice,
  sharesOwned,
  maxBuyShares,
  remainingAmount,
  investmentAmount,
  onSharesChange,
}: BursaExchangeInputsProps) {
  const totalValue = shares * unitPrice;

  const sellPresets = [
    { label: "25%", count: Math.max(1, Math.floor(sharesOwned * 0.25)) },
    { label: "50%", count: Math.max(1, Math.floor(sharesOwned * 0.5)) },
    { label: "75%", count: Math.max(1, Math.floor(sharesOwned * 0.75)) },
    { label: "100% (Semua)", count: Math.max(1, sharesOwned) },
  ];

  const buyPresets = [
    { label: "+1 Lot", count: 1 },
    { label: "+5 Lot", count: 5 },
    { label: "+10 Lot", count: 10 },
    { label: "+25 Lot", count: 25 },
    { label: maxBuyShares > 0 ? `Maks (${maxBuyShares})` : "Maks", count: maxBuyShares > 0 ? maxBuyShares : 1 },
  ];

  const handleSharesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onSharesChange(0);
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val)) {
      if (mode === "sell" && sharesOwned > 0) {
        onSharesChange(Math.max(1, Math.min(val, sharesOwned)));
      } else {
        onSharesChange(Math.max(1, val));
      }
    }
  };

  return (
    <div className="space-y-3">
      {mode === "buy" && remainingAmount > 0 && (
        <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span>Sisa Kuota: <strong>{formatIDR(remainingAmount)}</strong></span>
          {maxBuyShares > 0 && (
            <button type="button" onClick={() => onSharesChange(maxBuyShares)} className="text-[10px] font-bold underline hover:text-blue-300">
              Pilih Maksimal ({maxBuyShares} lbr)
            </button>
          )}
        </div>
      )}

      {mode === "sell" && (
        <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span>Kepemilikan: <strong>{sharesOwned} lbr ({formatIDR(investmentAmount)})</strong></span>
          {sharesOwned > 0 && (
            <button type="button" onClick={() => onSharesChange(sharesOwned)} className="text-[10px] font-bold underline hover:text-rose-300">
              Jual Semua Saham ({sharesOwned} lbr)
            </button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0f1420] p-3 space-y-1">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <span>{mode === "buy" ? "Jumlah Beli Saham (Lot / Lembar)" : "Jumlah Jual Saham (Lot / Lembar)"}</span>
          <span className="text-[9px] text-slate-500 font-mono">@{formatIDR(unitPrice)}/lbr</span>
        </div>
        <div className="flex items-center justify-between">
          <input
            type="number"
            min="1"
            max={mode === "sell" ? sharesOwned || 1 : maxBuyShares || 999999}
            value={shares === 0 ? "" : shares}
            onChange={handleSharesInput}
            placeholder="Ketik jumlah lot/lembar..."
            className="w-full bg-transparent text-xl font-extrabold text-slate-900 dark:text-white outline-none"
          />
          <span className="text-xs font-bold text-slate-400 shrink-0 ml-2">Lot/Lembar</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-100/60 dark:bg-slate-800/40 p-3">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Estimasi Nilai Transaksi</div>
        <div className={`text-lg font-black mt-0.5 ${mode === "sell" ? "text-rose-500" : "text-[#1D5FAE] dark:text-blue-400"}`}>{formatIDR(totalValue)}</div>
      </div>

      <div className="flex gap-1.5 pt-0.5">
        {(mode === "sell" ? sellPresets : buyPresets).map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={mode === "sell" && sharesOwned === 0}
            onClick={() => onSharesChange(preset.count)}
            className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:border-blue-500/40 transition disabled:opacity-30 shadow-xs"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
