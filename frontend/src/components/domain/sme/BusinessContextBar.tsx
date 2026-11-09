"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, ChevronDown, Check, Plus, ExternalLink,
  Receipt, FileSpreadsheet, ArrowRightLeft, Package,
  Bot, TrendingUp, Gauge, ScanLine, FileText,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useMySMEs } from "@/hooks/use-sme-list";

const TABS = [
  { href: "/sme/kasir", label: "Kasir (POS)", icon: Receipt },
  { href: "/sme/laporan", label: "Laporan Keuangan", icon: FileSpreadsheet },
  { href: "/sme/transaksi", label: "Transaksi", icon: ArrowRightLeft },
  { href: "/sme/inventaris", label: "Inventaris", icon: Package },
  { href: "/sme/copilot", label: "AI Co-Pilot", icon: Bot },
  { href: "/sme/kampanye", label: "Jual Saham", icon: TrendingUp },
  { href: "/sme/skor", label: "Skor Kesiapan", icon: Gauge },
  { href: "/sme/nota", label: "Pindai Nota", icon: ScanLine },
  { href: "/sme/dokumen", label: "Dokumen", icon: FileText },
];

export function BusinessContextBar() {
  const pathname = usePathname();
  const { smeId, setSelectedSmeId } = useSession();
  const { data: businesses } = useMySMEs();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentBiz = businesses?.find((b) => b.id === smeId) ?? businesses?.[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentBiz) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#E2E7EB] dark:border-white/10 bg-[#FEF7EC] dark:bg-amber-950/20 text-[#C58A1E] dark:text-amber-200 text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>Pilih atau daftarkan bisnis Anda untuk mulai mengelola modul operasional.</span>
        </div>
        <Link href="/sme/bisnis" className="px-3.5 py-1.5 rounded-lg bg-[#C58A1E] hover:bg-amber-700 text-white font-semibold shrink-0 transition">
          Pilih Bisnis
        </Link>
      </div>
    );
  }

  return (
    <header className="w-full bg-white dark:bg-[#132235] rounded-xl p-3.5 sm:p-4 border border-[#E2E7EB] dark:border-white/[0.08] shadow-xs flex flex-col gap-3 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="group flex items-center gap-3 bg-[#F4F3F1] dark:bg-[#172940] hover:bg-[#EFEEEB] dark:hover:bg-[#1e3452] px-3.5 py-2 rounded-xl text-left transition-all duration-150 border border-[#E2E7EB] dark:border-white/5"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1D5FAE] text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs sm:text-sm text-[#0F1E2E] dark:text-white group-hover:text-[#1D5FAE] dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                  {currentBiz.business_name}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#DFE9F1] dark:bg-blue-950 text-[#1D5FAE] dark:text-blue-300 shrink-0">
                  Aktif
                </span>
              </div>
              <span className="text-[11px] text-[#516072] dark:text-slate-400 truncate">
                {currentBiz.sector || "Usaha Mikro"} • Standar SAK EMKM
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#516072] dark:text-slate-400 group-hover:translate-y-0.5 transition-transform ml-1 ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-[#E2E7EB] bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#132235] z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#516072] dark:text-slate-400">Pilih Bisnis yang Dikelola</div>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {(businesses ?? []).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => { setSelectedSmeId(b.id); setMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-left transition ${b.id === currentBiz.id ? "bg-[#DFE9F1] font-bold text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300" : "text-[#0F1E2E] dark:text-slate-300 hover:bg-[#F4F3F1] dark:hover:bg-white/5"}`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold truncate">{b.business_name}</div>
                      <div className="text-[10px] text-[#516072] dark:text-slate-400">{b.sector}</div>
                    </div>
                    {b.id === currentBiz.id && <Check className="h-4 w-4 text-[#1D5FAE] shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#E2E7EB] dark:border-white/10 mt-1.5 pt-1.5">
                <Link href="/sme/bisnis" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAE] dark:text-blue-400 hover:bg-[#DFE9F1]/60 dark:hover:bg-blue-950/40 transition">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Kelola Semua Bisnis</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DFE9F1] dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-[11px] font-semibold text-[#1D5FAE] dark:text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D5FAE]"></span>
            <span>SAK EMKM Kepatuhan Aktif</span>
          </div>
          <Link href={`/sme/bisnis/${currentBiz.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1D5FAE] dark:text-blue-400 hover:bg-[#DFE9F1] dark:hover:bg-blue-950/50 transition">
            <span>Detail Bisnis</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="h-px w-full bg-[#E2E7EB] dark:bg-white/[0.08]" />

      <nav aria-label="Modul Bisnis" className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${isActive
                ? "bg-[#1D5FAE] text-white shadow-xs font-bold"
                : "text-[#516072] dark:text-slate-400 hover:bg-[#F4F3F1] dark:hover:bg-white/5 hover:text-[#0F1E2E] dark:hover:text-white"
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
