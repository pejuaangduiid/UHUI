"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft, ShoppingCart, FileSpreadsheet, FileText, Package,
  Sparkles, TrendingUp, Gauge, Receipt, FileCheck2, Users, Building2, CheckCircle2
} from "lucide-react";
import { useMySMEs } from "@/hooks/use-sme-list";
import { useSession } from "@/hooks/use-session";

const BUSINESS_MODULES = [
  { href: "/sme/kasir", label: "Kasir (POS)", desc: "Pencatatan kasir instan, pesanan langsung, dan cetak struk.", icon: ShoppingCart, color: "text-blue-500", border: "hover:border-blue-500/40" },
  { href: "/sme/laporan", label: "Laporan Keuangan", desc: "Neraca, Laba Rugi, dan Arus Kas standar SAK EMKM.", icon: FileSpreadsheet, color: "text-purple-500", border: "hover:border-purple-500/40" },
  { href: "/sme/transaksi", label: "Transaksi Kas", desc: "Buku kas masuk/keluar harian, mutasi, dan verifikasi nota.", icon: FileText, color: "text-blue-500", border: "hover:border-blue-500/40" },
  { href: "/sme/inventaris", label: "Inventaris & Stok", desc: "Manajemen katalog produk, stok opname, dan peringatan habis.", icon: Package, color: "text-amber-500", border: "hover:border-amber-500/40" },
  { href: "/sme/copilot", label: "AI Co-Pilot", desc: "Analisis kesehatan finansial dan rekomendasi taktis bisnis.", icon: Sparkles, color: "text-sky-500", border: "hover:border-sky-500/40" },
  { href: "/sme/kampanye", label: "Jual Saham Usaha", desc: "Buka kampanye pendanaan ekuitas mikro ke investor bursa.", icon: TrendingUp, color: "text-rose-500", border: "hover:border-rose-500/40" },
  { href: "/sme/skor", label: "Skor Kesiapan", desc: "Evaluasi 7 pilar kesiapan investasi (0-100) dan valuasi.", icon: Gauge, color: "text-sky-600", border: "hover:border-sky-500/40" },
  { href: "/sme/nota", label: "Pindai Nota (OCR)", desc: "Unggah foto struk fisik untuk pencatatan otomatis via AI.", icon: Receipt, color: "text-indigo-500", border: "hover:border-indigo-500/40" },
  { href: "/sme/dokumen", label: "Dokumen Legalitas", desc: "Kelola berkas legalitas NIB, NPWP, dan sertifikat izin usaha.", icon: FileCheck2, color: "text-orange-500", border: "hover:border-orange-500/40" },
  { href: "/sme/ruang-rapat", label: "Ruang Rapat", desc: "Forum privat tertutup khusus investor pemegang saham usaha.", icon: Users, color: "text-slate-500", border: "hover:border-slate-500/40" },
];

export default function BusinessDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { data: businesses, isLoading } = useMySMEs();
  const { smeId: activeSmeId, setSelectedSmeId } = useSession();

  const biz = businesses?.find((b) => b.id === id);

  useEffect(() => {
    if (id && activeSmeId !== id) {
      setSelectedSmeId(id);
    }
  }, [id, activeSmeId, setSelectedSmeId]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl animate-pulse">
        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!biz) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <Building2 className="h-12 w-12 mx-auto text-slate-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bisnis Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Bisnis yang Anda cari mungkin telah dihapus atau tidak terdaftar.</p>
        <Link href="/sme/bisnis" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Kembali ke Bisnis Saya
        </Link>
      </div>
    );
  }

  const isActive = activeSmeId === biz.id;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/sme/bisnis" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-500 transition">
        <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar Bisnis
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#121827]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{biz.sector}</span>
              {biz.is_incorporated_pt && <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">PT Resmi</span>}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Skor: {biz.digital_readiness_score ? `${biz.digital_readiness_score}/100` : "Belum Dinilai"}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">{biz.business_name}</h1>
            {biz.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{biz.description}</p>}
          </div>

          <div className="shrink-0">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-xs font-bold text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-4 w-4" /> Bisnis Aktif
              </span>
            ) : (
              <button type="button" onClick={() => setSelectedSmeId(biz.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition">
                Jadikan Bisnis Aktif
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Menu &amp; Modul Operasional</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {BUSINESS_MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className={`flex flex-col justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#121827] shadow-sm transition hover:shadow-md ${mod.border}`}>
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${mod.color}`}>
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{mod.label}</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{mod.desc}</p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] text-[11px] font-semibold text-blue-500">
                Buka Modul &rarr;
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

