"use client";

import React from "react";
import { Building2, TrendingUp, GraduationCap, MessageSquare, AlertTriangle, Users } from "lucide-react";
import type { components } from "@/types/api";

type StatsDTO = components["schemas"]["StatsDTO"];

interface AdminStatCardsProps {
  stats?: StatsDTO;
  isLoading: boolean;
}

export function AdminStatCards({ stats, isLoading }: AdminStatCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-white/[0.05]" />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Bisnis UMKM",
      val: stats.total_smes,
      sub: `${stats.suspended_smes} Ditangguhkan`,
      icon: Building2,
      subColor: stats.suspended_smes > 0 ? "text-rose-500" : "text-slate-400",
      iconBg: "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300",
    },
    {
      label: "Kampanye Bursa",
      val: stats.total_campaigns,
      sub: `${stats.suspended_campaigns} Ditangguhkan`,
      icon: TrendingUp,
      subColor: stats.suspended_campaigns > 0 ? "text-rose-500" : "text-slate-400",
      iconBg: "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300",
    },
    {
      label: "Kursus LMS",
      val: stats.total_courses,
      sub: "Materi & Modul SAK",
      icon: GraduationCap,
      subColor: "text-slate-400",
      iconBg: "bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300",
    },
    {
      label: "Postingan Komunitas",
      val: stats.total_threads,
      sub: `${stats.moderated_threads} Telah Dihapus`,
      icon: MessageSquare,
      subColor: stats.moderated_threads > 0 ? "text-amber-500" : "text-slate-400",
      iconBg: "bg-purple-500/10 text-purple-500",
    },
    {
      label: "Pengguna Ditangguhkan",
      val: stats.suspended_users,
      sub: stats.suspended_users > 0 ? "Sedang Kena Sanksi" : "Tidak Ada Sanksi",
      icon: Users,
      subColor: stats.suspended_users > 0 ? "text-rose-500 font-bold" : "text-slate-400",
      iconBg: "bg-rose-500/10 text-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {items.map((it, idx) => {
        const Icon = it.icon;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{it.label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${it.iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {it.val}
              </div>
              <div className={`text-[11px] mt-0.5 flex items-center gap-1 ${it.subColor}`}>
                {it.sub.includes("Ditangguhkan") || it.sub.includes("Sanksi") ? <AlertTriangle className="h-3 w-3" /> : null}
                <span>{it.sub}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

