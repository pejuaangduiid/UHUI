"use client";

import React from "react";
import { Calendar, CheckCircle } from "lucide-react";
import type { components } from "@/types/api";

type Webinar = components["schemas"]["WebinarDTO"];

interface WebinarListSectionProps {
  webinars: Webinar[];
  onRegister: (id: string) => void;
  isPending: boolean;
  registeredMap: Record<string, boolean>;
}

export function WebinarListSection({
  webinars,
  onRegister,
  isPending,
  registeredMap,
}: WebinarListSectionProps) {
  if (webinars.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-[#121827] p-8 text-center text-xs text-slate-400">
        Belum ada jadwal webinar aktif saat ini.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {webinars.map((w) => {
        const isDone = registeredMap[w.id] || w.is_registered;
        return (
          <div
            key={w.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] flex flex-col justify-between space-y-4 hover:border-[#1D5FAE]/40 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-[#1D5FAE]" />
                <span>{new Date(w.scheduled_at).toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{w.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Narasumber: <span className="font-bold text-slate-700 dark:text-slate-200">{w.speaker_name}</span> ({w.speaker_role})
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.05]">
              <span className="text-[11px] text-slate-400">{w.registration_count} Peserta Terdaftar</span>
              <button
                type="button"
                disabled={isDone || isPending}
                onClick={() => onRegister(w.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[11px] text-xs font-semibold transition shadow-sm active:scale-[0.985] ${isDone
                  ? "bg-[#DFE9F1] text-[#00478C] dark:bg-blue-950/60 dark:text-blue-300 border border-[#B9C8DD] dark:border-blue-900/40"
                  : "bg-[#1D5FAE] hover:bg-[#184e91] text-white"
                  }`}
              >
                {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : null}
                <span>{isDone ? "Terdaftar" : "Daftar Gratis"}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

