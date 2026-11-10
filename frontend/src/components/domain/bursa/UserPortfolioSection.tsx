"use client";

import React from "react";
import Link from "next/link";
import { usePortfolio } from "@/hooks/use-invest";
import { formatIDR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { TrendingUp, PieChart, AlertCircle, ArrowUpRight, MessageSquare } from "lucide-react";

interface UserPortfolioSectionProps {
  onExplore: () => void;
}

export function UserPortfolioSection({ onExplore }: UserPortfolioSectionProps) {
  const { data: items, isLoading } = usePortfolio();

  const totalInvested = (items ?? []).reduce((acc, curr) => {
    return curr.status === "confirmed" ? acc + curr.amount_idr : acc;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Investasi Aktif</span>
            <PieChart className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{formatIDR(totalInvested)}</div>
          <p className="text-[11px] text-slate-400">Saldo virtual sandbox edukasi</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Jumlah Portofolio UMKM</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{items?.length ?? 0} UMKM</div>
          <p className="text-[11px] text-slate-400">Kontrak kemitraan aktif</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-2xl border border-slate-200/50 bg-slate-100/50 dark:border-white/5 dark:bg-slate-900/40 animate-pulse" />
      ) : !items || items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center bg-white dark:border-white/10 dark:bg-[#121827] text-slate-500 dark:text-slate-400 text-xs space-y-3">
          <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Belum ada investasi saham dalam portofolio Anda</p>
          <p>Kunjungi katalog bursa untuk menemukan UMKM potensial dengan standar pembukuan terverifikasi.</p>
          <button
            type="button"
            onClick={onExplore}
            className="inline-block bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-500 transition shadow-sm"
          >
            Lihat Katalog Bursa Saham
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 dark:border-white/[0.06] dark:bg-slate-800/40 dark:text-slate-400 text-left">
                <tr>
                  <th className="p-4">UMKM &amp; Kampanye</th>
                  <th className="p-4">Skema</th>
                  <th className="p-4 text-right">Nilai Investasi</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4 text-right">Aksi &amp; Diskusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.business_name}</div>
                      <div className="text-[11px] text-slate-400">{item.campaign_title}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300">
                        {item.scheme === "micro_equity" ? "Mikro-Ekuitas" : "Bagi Hasil"}
                      </span>
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatIDR(item.amount_idr)}
                    </td>
                    <td className="p-4">
                      {item.status === "refunded" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          Saham Dijual (Refunded)
                        </span>
                      ) : item.status === "confirmed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300 border border-[#B9C8DD] dark:border-blue-900/40">
                          Saham Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">{formatDate(item.created_at)}</td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/bursa/${item.campaign_slug}`}
                        className="inline-flex items-center gap-1 text-[#1D5FAE] hover:underline font-semibold"
                        title="Lihat Saham / Kampanye Usaha"
                      >
                        <span>Lihat Saham</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      {item.status !== "refunded" && (
                        <Link
                          href="/sme/ruang-rapat"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-[11px]"
                          title="Buka Ruang Diskusi Pemegang Saham"
                        >
                          <MessageSquare className="h-3 w-3" /> Diskusi
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

