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
          <Link
          key={c.id}
          href={`${basePath}/${c.slug}`}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] flex flex-col justify-between space-y-4 hover:border-[#1D5FAE]/50 hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300 border border-[#B9C8DD] dark:border-blue-900/40">
              Tingkat {c.level}
            </span>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-[#1D5FAE] transition-colors">{c.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{c.description}</p>
          </div>
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{c.lesson_count} Modul Materi</span>
              <span className="font-extrabold text-[#1D5FAE] dark:text-blue-400">{formatIDR(c.price_idr)}</span>
            </div>
            <div
              className="w-full inline-flex items-center justify-center gap-1.5 bg-[#1D5FAE] group-hover:bg-[#184e91] text-white py-2 px-4 rounded-[11px] text-xs font-semibold transition shadow-sm active:scale-[0.985]"
            >
              <span>{c.is_enrolled ? "Lanjutkan Belajar" : "Lihat Silabus"}</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        </Link >
      ))
}
    </div >
  );
}

