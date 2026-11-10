"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, TrendingUp, ArrowRight, BarChart3, Building } from "lucide-react";

export function OjkScfSection() {
  return (
    <section className="py-16 border-t border-slate-100 dark:border-white/[0.06] bg-gradient-to-b from-white to-blue-50/40 dark:from-[#0B132B] dark:to-[#0F1E2E]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl space-y-10">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Regulasi POJK Nomor 17 Tahun 2025 &bull; Securities Crowdfunding</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Rekam Jejak Baru Bermakna Jika Mampu Membuka Akses Modal
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Melalui skema *securities crowdfunding* (SCF) sesuai POJK No. 17 Tahun 2025, yang telah dimanfaatkan <strong>634 penerbit UMKM</strong> dengan total dana dihimpun mencapai <strong>Rp2,06 triliun</strong>, UHUI memposisikan diri untuk mengelola operasional usaha, menampilkan data kinerja, dan bermitra dengan penyelenggara berizin OJK.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#121827] space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              1. Kelola Operasional Kasir
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Mulai langsung tanpa beban verifikasi. Gunakan POS, manajemen stok, dan pemindai nota untuk mencatat arus kas riil toko Anda setiap hari.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#121827] space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              2. Bentuk Standar SAK EMKM
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Transaksi harian otomatis terkonversi menjadi buku besar berpasangan, laporan keuangan standar SAK EMKM, dan Skor Kesiapan Usaha.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-white/[0.08] dark:bg-[#121827] space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              3. Tiket Menuju Modal SCF
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ketika siap menjual saham, data pembukuan Anda menjadi tiket kurasi untuk diajukan ke Penyelenggara SCF resmi berizin OJK secara patuh regulasi.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-blue-500/30 bg-blue-600/5 p-5 dark:bg-blue-950/20">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
              Siap Mengubah Data Harian Menjadi Pertumbuhan?
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Jelajahi bursa saham simulasi atau mulai pencatatan kas UMKM Anda secara gratis hari ini.
            </p>
          </div>
          <Link
            href="/bursa"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
          >
            <span>Eksplorasi Bursa Saham</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

