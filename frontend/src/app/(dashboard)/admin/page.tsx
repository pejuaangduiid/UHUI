"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Building2, GraduationCap, MessageSquare, ChevronRight, FileCheck } from "lucide-react";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { AdminStatCards } from "@/components/admin/AdminStatCards";

export default function SuperadminDashboardPage() {
  const { stats, isLoading } = useAdminStats();

  const adminModules = [
    {
      title: "Bisnis & Bursa Saham",
      desc: "Pantau operasional seluruh UMKM dan kampanye bursa. Suspend atau aktifkan kembali bila ada pelanggaran.",
      href: "/admin/bisnis",
      icon: Building2,
      iconBg: "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300",
      badge: `${stats?.suspended_smes ?? 0} Ditangguhkan`,
    },
    {
      title: "Manajemen Kursus (CRUD)",
      desc: "Buat kursus baru, perbarui silabus, kelola kurikulum SAK EMKM terstandar, dan atur modul bacaan teks.",
      href: "/admin/kursus",
      icon: GraduationCap,
      iconBg: "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300",
      badge: `${stats?.total_courses ?? 0} Kursus Aktif`,
    },
    {
      title: "Moderasi Komunitas & Sanksi",
      desc: "Hapus postingan/komentar bermasalah (otomatis berlabel dihapus oleh admin) dan suspend pengguna dalam durasi jam tertentu.",
      href: "/admin/komunitas",
      icon: MessageSquare,
      iconBg: "bg-[#FEF7EC] text-[#C58A1E] dark:bg-amber-950/60 dark:text-amber-400",
      badge: `${stats?.suspended_users ?? 0} Akun Disanksi`,
    },
    {
      title: "Kurasi Dokumen Legal",
      desc: "Validasi keabsahan dokumen NIB, NPWP, Akta PT Kemenkumham, dan rekening bisnis yang diajukan UMKM.",
      href: "/admin/verifikasi",
      icon: FileCheck,
      iconBg: "bg-[#F4F3F1] text-[#0F1E2E] dark:bg-white/10 dark:text-white",
      badge: "Antrean Kurator",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Superadmin Header with Environment Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E7EB] dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D1C2C] text-white shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
                Pusat Kendali Superadmin UHUI
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FEF7EC] text-[#C58A1E] dark:bg-amber-950/60 dark:text-amber-300">
                Mode Pengawas
              </span>
            </div>
            <p className="text-xs text-[#516072] dark:text-slate-400 mt-0.5">
              Pengawasan menyeluruh ekosistem: penangguhan bisnis, bursa, kurasi SAK EMKM, dan tata tertib komunitas.
            </p>
          </div>
        </div>
      </div>

      <AdminStatCards stats={stats} isLoading={isLoading} />

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#0F1E2E] dark:text-white flex items-center gap-2">
          <span>Modul Operasional Superadmin</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {adminModules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Link
                key={idx}
                href={m.href}
                className="stitch-card p-5 flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.iconBg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-[#516072] dark:text-slate-300 bg-[#F4F3F1] dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                      {m.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F1E2E] dark:text-white group-hover:text-[#1D5FAE] dark:group-hover:text-blue-400 transition">
                      {m.title}
                    </h4>
                    <p className="text-xs text-[#516072] dark:text-slate-400 mt-1 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E2E7EB] dark:border-white/[0.06] text-xs font-bold text-[#1D5FAE] dark:text-blue-400">
                  <span>Buka Kelola</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
