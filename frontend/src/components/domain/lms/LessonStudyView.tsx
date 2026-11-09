"use client";

import React from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock, BookOpen, ShieldCheck, Sparkles, CheckSquare } from "lucide-react";
import type { components } from "@/types/api";

type Lesson = components["schemas"]["LessonDTO"];

interface LessonStudyViewProps {
  lesson: Lesson;
  lessonIndex: number;
  totalLessons: number;
  lessons: Lesson[];
  completedLessons: Record<string, boolean>;
  onToggleComplete: (id: string) => void;
  onBack: () => void;
  onSelectLesson: (l: Lesson) => void;
  onPrevLesson?: () => void;
  onNextLesson?: () => void;
}

export function LessonStudyView({
  lesson,
  lessonIndex,
  totalLessons,
  lessons,
  completedLessons,
  onToggleComplete,
  onBack,
  onSelectLesson,
  onPrevLesson,
  onNextLesson,
}: LessonStudyViewProps) {
  const isDone = Boolean(completedLessons[lesson.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Silabus Kursus</span>
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Modul {lessonIndex + 1} dari {totalLessons}</span>
          <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border text-[11px] ${isDone ? "text-blue-600 bg-blue-500/10 border-blue-500/20" : "text-blue-500 bg-blue-500/10 border-blue-500/20"
            }`}>
            <CheckCircle2 className="h-3 w-3" /> {isDone ? "Selesai Dipelajari" : "Akses Penuh"}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Modul Bacaan Teks #{lessonIndex + 1}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{lesson.title}</h2>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span>Estimasi Baca {lesson.duration_minutes} Menit</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
            <span className="font-bold text-blue-700 dark:text-blue-300 text-xs uppercase tracking-wider block">Ringkasan Materi Pokok</span>
            <p className="font-medium text-slate-900 dark:text-white">{lesson.content_text || "Pelajari panduan tata kelola pembukuan dan implementasi kasir serta stok UMKM."}</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.05] space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Pedoman Standar SAK EMKM &amp; SOP Operasional</span>
            </h3>
            <p>
              Prinsip entitas ekonomi mensyaratkan pencatatan keuangan usaha terisolasi penuh dari kekayaan pribadi pemilik. Seluruh transaksi penerimaan dan pengeluaran kas wajib terdokumentasi dengan bukti sah serta terekonsiliasi harian.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#101624] border border-slate-200/80 dark:border-white/[0.08] space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><CheckSquare className="h-3.5 w-3.5 text-blue-500" /> 1. Pemisahan Kas Kasir</span>
                <p className="text-slate-500 dark:text-slate-400">Uang laci kasir hanya digunakan untuk transaksi operasional dan kembalian pelanggan, bukan untuk keperluan pribadi.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#101624] border border-slate-200/80 dark:border-white/[0.08] space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><CheckSquare className="h-3.5 w-3.5 text-blue-500" /> 2. Rekonsiliasi &amp; Opname</span>
                <p className="text-slate-500 dark:text-slate-400">Lakukan pencocokan saldo fisik dengan catatan POS setiap pergantian shift untuk mengeliminasi potensi selisih.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] space-y-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Langkah Penerapan Praktis di Sistem UHUI:</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Buka menu Kasir (POS) untuk mencatat penjualan kas harian, foto nota fisik pada menu Foto Nota untuk validasi belanja bahan baku, dan pantau neraca pada modul Laporan Keuangan SAK EMKM.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <button type="button" onClick={onPrevLesson} disabled={!onPrevLesson} className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Modul Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => onToggleComplete(lesson.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${isDone ? "bg-[#1D5FAE] text-white hover:bg-[#184e91]" : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300"
              }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isDone ? "✓ Selesai Dipelajari (Klik Batal)" : "Tandai Selesai"}</span>
          </button>
          <button type="button" onClick={onNextLesson} disabled={!onNextLesson} className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-40">
            Modul Berikutnya <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pilih Modul Bacaan Lain</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {lessons.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelectLesson(l)}
              className={`p-2 rounded-xl text-left text-xs transition flex items-center justify-between border ${l.id === lesson.id
                  ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                  : "border-slate-100 dark:border-white/[0.05] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
            >
              <span className="truncate pr-2">{i + 1}. {l.title}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {Boolean(completedLessons[l.id]) && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                <span className="text-[10px] text-slate-400">{l.duration_minutes}m</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
