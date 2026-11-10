"use client";

import React, { useState } from "react";
import { useCourses } from "@/hooks/use-lms";
import { EnrolledCoursesSection } from "@/components/domain/lms/EnrolledCoursesSection";
import { CourseCatalogSection } from "@/components/domain/lms/CourseCatalogSection";
import { WalletBadge } from "@/components/domain/wallet/WalletBadge";
import { BookOpen, CheckCircle2, Search, Filter } from "lucide-react";

export default function SmeKursusDashboardPage() {
  const { data: courses, isLoading } = useCourses();
  const [activeTab, setActiveTab] = useState<"semua" | "saya">("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [levelFilter, setLevelFilter] = useState("");

  const allCourses = courses ?? [];
  const enrolledCourses = allCourses.filter((c) => c.is_enrolled);
  const enrolledCount = enrolledCourses.length;

  const filteredCourses = allCourses.filter((c) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = c.title.toLowerCase().includes(term) || c.description.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (priceFilter === "free" && c.price_idr > 0) return false;
    if (priceFilter === "paid" && c.price_idr === 0) return false;
    if (levelFilter && c.level.toLowerCase() !== levelFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Akademi &amp; Kursus Bisnis
            </h1>
              <span className="text-[11px] font-bold bg-[#DFE9F1] dark:bg-blue-950/60 text-[#1D5FAE] dark:text-blue-300 border border-[#B9C8DD] dark:border-blue-900/40 px-2.5 py-0.5 rounded-full">
                SAK EMKM
              </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pelajari tata kelola usaha, modul akuntansi, dan ikuti kelas terverifikasi.
          </p>
        </div>
        <WalletBadge />
      </div>

      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#121827] border border-slate-200 dark:border-white/[0.06] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("semua")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "semua"
              ? "bg-white dark:bg-slate-800 text-[#1D5FAE] dark:text-blue-300 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Semua Kursus</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saya")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "saya"
              ? "bg-white dark:bg-slate-800 text-[#1D5FAE] dark:text-blue-300 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Kursus Saya</span>
          {enrolledCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#DFE9F1] dark:bg-blue-950 text-[#1D5FAE] dark:text-blue-300 font-extrabold">
                {enrolledCount}
              </span>
          )}
            </button>
      </div>

      {activeTab === "semua" ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari materi kursus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 dark:border-white/10 dark:bg-[#131926] text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as "all" | "free" | "paid")}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 dark:border-white/10 dark:bg-[#131926] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
              >
                <option value="all">Semua Biaya</option>
                <option value="free">Gratis (Rp 0)</option>
                <option value="paid">Berbayar</option>
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 dark:border-white/10 dark:bg-[#131926] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
              >
                <option value="">Semua Tingkat</option>
                <option value="pemula">Tingkat Pemula</option>
                <option value="menengah">Tingkat Menengah</option>
                <option value="mahir">Tingkat Mahir</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => <div key={i} className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <CourseCatalogSection courses={filteredCourses} basePath="/sme/kursus" />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <EnrolledCoursesSection
            courses={enrolledCourses}
            onExplore={() => setActiveTab("semua")}
            basePath="/sme/kursus"
          />
        </div>
      )}
    </div>
  );
}
