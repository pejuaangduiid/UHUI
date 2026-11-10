"use client";

import React, { useState } from "react";
import { useCourses, useWebinars, useRegisterWebinar } from "@/hooks/use-lms";
import { EnrolledCoursesSection } from "@/components/domain/lms/EnrolledCoursesSection";
import { CourseCatalogSection } from "@/components/domain/lms/CourseCatalogSection";
import { WebinarListSection } from "@/components/domain/lms/WebinarListSection";
import { GraduationCap, Video, BookOpen } from "lucide-react";

export default function KursusCatalogPage() {
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: webinars, isLoading: loadingWebinars } = useWebinars();
  const registerWebinar = useRegisterWebinar();
  const [registeredMap, setRegisteredMap] = useState<Record<string, boolean>>({});

  const hasEnrolled = (courses ?? []).some((c) => c.is_enrolled);

  const handleRegisterWebinar = (id: string) => {
    registerWebinar.mutate(id, {
      onSuccess: () => setRegisteredMap((prev) => ({ ...prev, [id]: true })),
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {hasEnrolled && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E7EB] dark:border-white/[0.08] pb-3">
            <GraduationCap className="h-5 w-5 text-[#1D5FAE]" />
            <h2 className="text-lg font-bold text-[#0F1E2E] dark:text-white">
              Kursus yang Sedang Anda Ikuti
            </h2>
          </div>
          <EnrolledCoursesSection courses={courses ?? []} basePath="/kursus" />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E7EB] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-[#1D5FAE]" />
            <h2 className="text-lg font-bold text-[#0F1E2E] dark:text-white">
              Webinar Pelatihan Gratis (Live Session)
            </h2>
          </div>
          <span className="text-xs text-[#1D5FAE] dark:text-blue-400 font-semibold bg-[#DFE9F1] dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
            100% Gratis &bull; Terbuka untuk Umum
          </span>
        </div>

        {loadingWebinars ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 rounded-[18px] bg-white/60 dark:bg-[#132235]/40 animate-pulse border border-[#E2E7EB] dark:border-white/[0.08]" />
            <div className="h-40 rounded-[18px] bg-white/60 dark:bg-[#132235]/40 animate-pulse border border-[#E2E7EB] dark:border-white/[0.08]" />
          </div>
        ) : (
          <WebinarListSection
            webinars={webinars ?? []}
            onRegister={handleRegisterWebinar}
            isPending={registerWebinar.isPending}
            registeredMap={registeredMap}
          />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E7EB] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#1D5FAE]" />
            <h2 className="text-lg font-bold text-[#0F1E2E] dark:text-white">
              Katalog Kursus Terstruktur
            </h2>
          </div>
          <span className="text-xs text-[#516072] dark:text-slate-400">Modul Interaktif &amp; E-Sertifikat</span>
        </div>

        {loadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 rounded-[18px] bg-white/60 dark:bg-[#132235]/40 animate-pulse border border-[#E2E7EB] dark:border-white/[0.08]" />
            <div className="h-64 rounded-[18px] bg-white/60 dark:bg-[#132235]/40 animate-pulse border border-[#E2E7EB] dark:border-white/[0.08]" />
            <div className="h-64 rounded-[18px] bg-white/60 dark:bg-[#132235]/40 animate-pulse border border-[#E2E7EB] dark:border-white/[0.08]" />
          </div>
        ) : (
          <CourseCatalogSection courses={courses ?? []} basePath="/kursus" />
        )}
      </div>
    </div>
  );
}
