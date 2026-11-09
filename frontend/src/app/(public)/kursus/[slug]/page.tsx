"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useCourse, useEnrollCourse } from "@/hooks/use-lms";
import { formatIDR } from "@/lib/money";
import { LessonViewer } from "@/components/domain/lms/LessonViewer";
import { GraduationCap, CheckCircle2, ShieldCheck } from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { data: course, isLoading } = useCourse(slug);
  const enrollMutation = useEnrollCourse();
  const [enrolledSuccess, setEnrolledSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <div className="h-10 w-1/2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Kursus tidak ditemukan.
      </div>
    );
  }

  const handleEnroll = () => {
    enrollMutation.mutate(course.id, {
      onSuccess: () => setEnrolledSuccess(true),
    });
  };

  const isEnrolled = enrolledSuccess || course.is_enrolled;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold uppercase text-blue-500 px-2.5 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
            Tingkat {course.level}
          </span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-400 font-medium">Instruktur: {course.instructor_name}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{course.title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">{course.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <LessonViewer lessons={course.lessons ?? []} isEnrolled={isEnrolled} />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-5">
            <div>
              <div className="text-xs text-slate-400">Biaya Investasi Pelatihan</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {course.price_idr === 0 ? "Gratis" : formatIDR(course.price_idr)}
              </div>
            </div>

            {isEnrolled ? (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-blue-500 mx-auto" />
                <p className="font-bold text-xs text-blue-600 dark:text-blue-400">Anda Sudah Terdaftar</p>
                <p className="text-[11px] text-slate-400">Akses modul aktif selamanya</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
              >
                {enrollMutation.isPending ? "Memproses..." : "Daftar & Ikuti Kursus"}
              </button>
            )}

            <div className="space-y-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-white/[0.05] pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                <span>Materi Terakreditasi IAI &amp; SAK EMKM</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                <span>Sertifikat Digital Resmi Kadin HUBURK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

