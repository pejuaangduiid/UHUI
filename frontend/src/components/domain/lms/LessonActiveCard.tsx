"use client";

import React from "react";
import { BookOpen, CheckCircle, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import type { components } from "@/types/api";

type Lesson = components["schemas"]["LessonDTO"];

interface LessonActiveCardProps {
  lesson: Lesson;
  isActiveDone: boolean;
  onToggleComplete: () => void;
  onStudy: () => void;
}

export function LessonActiveCard({
  lesson,
  isActiveDone,
  onToggleComplete,
  onStudy,
}: LessonActiveCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-blue-600 dark:text-blue-400">Modul Pembelajaran Aktif</span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-500 dark:text-slate-400">{lesson.duration_minutes} Menit</span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isActiveDone ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20" : "text-blue-600 dark:text-blue-400 bg-blue-500/10"
          }`}>
          {isActiveDone ? <CheckCircle2 className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
          {isActiveDone ? "Sudah Selesai" : "Akses Penuh"}
        </span>
      </div>

      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{lesson.title}</h3>
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-white/[0.05] text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
        <p>{lesson.content_text || "Materi modul teks dan panduan implementasi SAK EMKM interaktif siap dipelajari."}</p>
        <div className="pt-1 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Modul Pembelajaran Teks Terstandar</span>
        </div>
      </div>

      <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleComplete}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${isActiveDone ? "border-blue-500/30 text-blue-600 bg-blue-500/10" : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{isActiveDone ? "Tandai Belum Selesai" : "Tandai Selesai"}</span>
        </button>
        <button
          type="button"
          onClick={onStudy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Buka &amp; Pelajari Materi Ini</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
