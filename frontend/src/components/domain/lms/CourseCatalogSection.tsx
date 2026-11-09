"use client";

import React from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/money";
import { ArrowRight } from "lucide-react";
import type { components } from "@/types/api";

type Course = components["schemas"]["CourseDTO"];

interface CourseCatalogSectionProps {
  courses: Course[];
  basePath?: string;
}

export function CourseCatalogSection({ courses, basePath = "/sme/kursus" }: CourseCatalogSectionProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-[#121827] p-8 text-center text-xs text-slate-400">
        Belum ada materi kursus yang tersedia saat ini.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all"
        >
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Tingkat {c.level}
            </span>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{c.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{c.description}</p>
          </div>
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{c.lesson_count} Modul Materi</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400">{formatIDR(c.price_idr)}</span>
            </div>
            <Link
              href={`${basePath}/${c.slug}`}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
            >
              <span>{c.is_enrolled ? "Lanjutkan Belajar" : "Lihat Silabus"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

