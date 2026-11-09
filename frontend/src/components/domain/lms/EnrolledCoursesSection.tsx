"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, ArrowRight, PlayCircle } from "lucide-react";
import type { components } from "@/types/api";

type Course = components["schemas"]["CourseDTO"];

interface EnrolledCoursesSectionProps {
  courses: Course[];
  onExplore?: () => void;
  basePath?: string;
}

export function EnrolledCoursesSection({ courses, onExplore, basePath = "/sme/kursus" }: EnrolledCoursesSectionProps) {
  const enrolled = courses.filter((c) => c.is_enrolled);

  if (enrolled.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-[#121827] p-8 text-center text-xs space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mx-auto">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Belum ada kursus yang sedang diikuti
          </p>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Tingkatkan tata kelola bisnis dan kesiapan pendanaan usaha Anda dengan mengikuti materi kursus terstruktur.
          </p>
        </div>
        {onExplore && (
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm text-xs"
          >
            <span>Jelajahi Katalog Kursus</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {enrolled.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-blue-500/30 bg-white p-5 shadow-sm dark:border-blue-500/20 dark:bg-[#121827] flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                Tingkat {c.level}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle className="h-3 w-3" />
                <span>Sedang Berjalan</span>
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{c.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              Instruktur: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.instructor_name}</span>
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{c.lesson_count} Modul Materi</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Akses Terbuka</span>
            </div>
            <Link
              href={`${basePath}/${c.slug}`}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-[#1D5FAE] hover:bg-[#184e91] text-white py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Lanjutkan Belajar</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

