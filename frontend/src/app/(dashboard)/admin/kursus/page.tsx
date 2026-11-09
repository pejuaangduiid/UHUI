"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useAdminCourses } from "@/hooks/use-admin-courses";
import { AdminCourseList } from "@/components/admin/AdminCourseList";

export default function AdminKursusPage() {
  const { courses, isLoading, createCourse, updateCourse, deleteCourse } = useAdminCourses();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-500 mb-1 transition">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Ringkasan Superadmin</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Manajemen Kursus &amp; Modul Pembelajaran (CRUD)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola materi kurikulum SAK EMKM, tambah materi bacaan baru, dan perbarui silabus edukasi digital UMKM.
          </p>
        </div>
      </div>

      <AdminCourseList
        courses={courses}
        isLoading={isLoading || createCourse.isPending || updateCourse.isPending || deleteCourse.isPending}
        onCreateCourse={async (data) => {
          await createCourse.mutateAsync(data);
        }}
        onUpdateCourse={async (id, data) => {
          await updateCourse.mutateAsync({ id, input: data });
        }}
        onDeleteCourse={async (id) => {
          await deleteCourse.mutateAsync(id);
        }}
      />
    </div>
  );
}

