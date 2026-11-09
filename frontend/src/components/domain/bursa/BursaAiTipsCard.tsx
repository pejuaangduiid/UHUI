"use client";

import React from "react";
import { Sparkles, CheckCircle2, CircleDot, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatIDR } from "@/lib/money";

interface BursaAiTipsCardProps {
  businessName: string;
  currentPrice: number;
}

export function BursaAiTipsCard({ businessName, currentPrice }: BursaAiTipsCardProps) {
  const tips = [
    "Arus kas operasional positif dengan margin laba kotor 42% (SAK EMKM Terverifikasi).",
    "Rasio kecukupan modal kerja sehat, cadangan kas memadai untuk operasional 14 bulan ke depan.",
    "Rekomendasi valuasi: Harga saham saat ini stabil dengan potensi upside dari ekspansi gerai baru.",
  ];

  const milestones = [
    { title: "Verifikasi Legalitas NIB & SAK EMKM", done: true },
    { title: "Laporan Keuangan & Kasir Digital Terbuka", done: true },
    { title: "Kepatuhan Dividen & Laba Ditahan Terjadwal", done: true },
  ];

  const mockTxs = [
    { type: "buy", user: "Investor #482", shares: 2500, time: "10m lalu" },
    { type: "buy", user: "Investor #190", shares: 5000, time: "34m lalu" },
    { type: "sell", user: "Investor #082", shares: 1000, time: "1j lalu" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#131926]/90 backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Analisis AI &amp; Tips Usaha</h4>
            <span className="text-[10px] text-slate-400">Diagnosis Diagnostik SAK EMKM</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
          {tips.map((t, idx) => (
            <li key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#131926]/90 backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tata Kelola &amp; Kepatuhan</h4>
            <span className="text-[10px] text-slate-400">Standar Transparansi Ekosistem</span>
          </div>
        </div>
        <div className="space-y-2.5">
          {milestones.map((m, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="h-4 w-4 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shrink-0">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <span className="font-medium">{m.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#131926]/90 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <CircleDot className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Aktivitas Transaksi Pasar</h4>
              <span className="text-[10px] text-slate-400">{businessName}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          {mockTxs.map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
              <div className="flex items-center gap-2">
                {tx.type === "buy" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{tx.user}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 dark:text-white">
                  {tx.shares.toLocaleString("id-ID")} Lbr ({formatIDR(tx.shares * currentPrice)})
                </div>
                <div className="text-[10px] text-slate-400">{tx.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

