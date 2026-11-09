"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, FileCheck2, Package, Receipt, ShoppingCart, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useTransactions } from "@/hooks/use-transactions";
import { useReadiness } from "@/hooks/use-readiness";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { formatIDR } from "@/lib/money";

export default function SmeDashboardPage() {
  const { user, smeId } = useSession();
  const { aggregates } = useTransactions(smeId);
  const { score } = useReadiness(smeId);

  const revenue = aggregates?.revenue_idr ?? 0;
  const expense = aggregates?.expense_idr ?? 0;
  const netCashFlow = aggregates?.net_cash_flow_idr ?? 0;
  const activeDays = aggregates?.active_days_count ?? 0;

  const stats = [
    { label: "Pendapatan 30 Hari", badge: "Kas Masuk", badgeCls: "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/50 dark:text-blue-300", value: formatIDR(revenue), sub: "Total penjualan kasir" },
    { label: "Beban Operasional", badge: "Kas Keluar", badgeCls: "bg-[#FFDAD6] text-[#BA1A1A] dark:bg-red-950/40 dark:text-red-400", value: formatIDR(expense), sub: "Biaya operasional & HPP" },
    { label: "Arus Kas Bersih", badge: netCashFlow >= 0 ? "Surplus" : "Defisit", badgeCls: netCashFlow >= 0 ? "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/50 dark:text-blue-300" : "bg-[#FFDAD6] text-[#BA1A1A] dark:bg-red-950/40", value: formatIDR(netCashFlow), valCls: netCashFlow >= 0 ? "text-[#1D5FAE] dark:text-blue-400" : "text-[#BA1A1A] dark:text-red-400", sub: "Surplus kas standar SAK EMKM" },
    { label: "Konsistensi Kasir", badge: "SAK EMKM", badgeCls: "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300", value: `${activeDays} / 30 Hari`, sub: "Hari transaksi tercatat aktif" },
  ];

  const quickActions = [
    { href: "/sme/kasir", label: "Kasir POS", icon: ShoppingCart, bg: "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300" },
    { href: "/sme/nota", label: "Pindai Nota", icon: Receipt, bg: "bg-[#DFE9F1] text-[#1D5FAE]" },
    { href: "/sme/inventaris", label: "Inventaris", icon: Package, bg: "bg-[#FEF7EC] text-[#C58A1E]" },
    { href: "/sme/dokumen", label: "Dokumen Legal", icon: FileCheck2, bg: "bg-[#F4F3F1] text-[#0F1E2E] dark:bg-white/10 dark:text-white" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">Ringkasan Operasional &amp; Pembukuan</h1>
          <p className="text-xs sm:text-sm text-[#516072] dark:text-slate-400">Selamat datang, <span className="font-semibold text-[#0F1E2E] dark:text-slate-200">{user?.full_name ?? "Pemilik Usaha"}</span>. Pantau kas real-time dan kepatuhan SAK EMKM.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/sme/bisnis" className="inline-flex items-center gap-1.5 rounded-[11px] border border-[#E2E7EB] dark:border-white/10 bg-white dark:bg-[#132235] px-3.5 py-2 text-xs font-semibold text-[#0F1E2E] dark:text-slate-200 hover:bg-[#F4F3F1] transition">
            <Building2 className="h-3.5 w-3.5 text-[#1D5FAE]" /><span>Bisnis Saya</span>
          </Link>
          <Link href="/sme/kasir" className="inline-flex items-center gap-2 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] px-4 py-2 text-xs font-semibold text-white shadow-xs transition">
            <ShoppingCart className="h-3.5 w-3.5" /><span>Buka Kasir POS</span>
          </Link>
        </div>
      </div>

      {!smeId && (
        <div className="stitch-card p-5 bg-[#FEF7EC] dark:bg-amber-950/20 border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#C58A1E] dark:text-amber-300">Belum Ada Bisnis yang Dipilih</h3>
            <p className="text-xs text-[#516072] dark:text-slate-400">Daftarkan bisnis Anda untuk mulai mencatat penjualan kasir, stok inventaris, dan laporan keuangan.</p>
          </div>
          <Link href="/sme/bisnis" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[11px] bg-[#C58A1E] text-xs font-semibold text-white shrink-0">
            <Building2 className="h-4 w-4" /><span>Pilih Bisnis Sekarang</span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stitch-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#516072] dark:text-slate-400">{s.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.badgeCls}`}>{s.badge}</span>
            </div>
            <div className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${s.valCls ?? "text-[#0F1E2E] dark:text-white"}`}>{s.value}</div>
            <span className="mt-1 block text-xs text-[#66727F] dark:text-slate-400">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="stitch-card p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-3"><Zap className="h-4 w-4 text-[#1D5FAE]" /><h3 className="text-sm font-bold text-[#0F1E2E] dark:text-white">Skor Kesiapan Digital</h3></div>
          <ScoreRing score={score?.total ?? null} size={140} />
          <Link href="/sme/skor" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1D5FAE] dark:text-blue-400 hover:underline">
            <span>Analisis Gerbang Kesiapan</span><ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="stitch-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F1E2E] dark:text-white">Aksi Cepat Operasional</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {quickActions.map((act) => (
                <Link key={act.href} href={act.href} className="flex items-center gap-3 rounded-xl border border-[#E2E7EB] dark:border-white/[0.08] bg-[#FAF9F6] dark:bg-[#172940] p-3 transition hover:border-[#1D5FAE]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.bg}`}><act.icon className="h-4 w-4" /></div>
                  <span className="text-xs font-semibold text-[#0F1E2E] dark:text-white truncate">{act.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2E7EB] dark:border-white/[0.08] flex items-center justify-between text-xs text-[#516072]">
            <span>Standar EMKM Aktif</span>
            <Link href="/sme/laporan" className="font-semibold text-[#1D5FAE] hover:underline">Buka Laporan &rarr;</Link>
          </div>
        </div>

        <div className="stitch-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#0F1E2E] dark:text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#1D5FAE]" /><span>AI Business Co-Pilot</span></span>
              <Link href="/sme/copilot" className="text-xs font-semibold text-[#1D5FAE] hover:underline">Buka Chat &rarr;</Link>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs text-[#516072] dark:text-slate-300">
              <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#1D5FAE] mt-1.5 shrink-0" /><span>Pencatatan kasir minggu ini konsisten dan bebas anomali stok.</span></li>
              <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#1D5FAE] mt-1.5 shrink-0" /><span>Rasio perputaran persediaan menunjukkan produk terlaris siap restock.</span></li>
            </ul>
          </div>
          <div className="mt-5 rounded-xl bg-[#DFE9F1] dark:bg-blue-950/60 p-4 border border-[#B9C8DD] dark:border-blue-900/40">
            <div className="flex items-center justify-between text-xs font-bold text-[#1D5FAE] dark:text-blue-300">
              <span>Simulasi Valuasi Bisnis</span>
              <Link href="/sme/kampanye" className="inline-flex items-center gap-1 hover:underline">Jual Saham <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
