"use client";

import React, { useState } from "react";
import { BookOpen, Plus, Edit2, Trash2, ListChecks, CheckCircle, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/money";
import { CourseFormModal } from "./CourseFormModal";
import { LessonManagerModal } from "./LessonManagerModal";
import type { components } from "@/types/api";

type CourseAdminDTO = components["schemas"]["CourseAdminDTO"];
type CreateCourseInput = components["schemas"]["CreateCourseInput"];

interface AdminCourseListProps {
  courses: CourseAdminDTO[];
  onCreateCourse: (data: CreateCourseInput) => Promise<void>;
  onUpdateCourse: (id: string, data: CreateCourseInput) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function AdminCourseList({ courses, onCreateCourse, onUpdateCourse, onDeleteCourse, isLoading }: AdminCourseListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseAdminDTO | null>(null);
  const [managingCourse, setManagingCourse] = useState<CourseAdminDTO | null>(null);
  const [search, setSearch] = useState("");

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor_name.toLowerCase().includes(search.toLowerCase()) ||
    c.level.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (course: CourseAdminDTO) => {
    toast.warning(`Hapus kursus "${course.title}" secara permanen?`, {
      description: "Semua modul di dalamnya akan ikut terhapus.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await onDeleteCourse(course.id);
            toast.success(`Kursus "${course.title}" berhasil dihapus.`);
          } catch {
            toast.error("Gagal menghapus kursus.");
          }
        },
      },
      cancel: { label: "Batal", onClick: () => { } },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kursus, instruktur, tingkat..."
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#121827] dark:text-white"
        />
        <button
          type="button"
          onClick={() => { setEditingCourse(null); setIsFormOpen(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Kursus Baru</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-400 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <tr>
              <th className="py-3 px-4 font-semibold">Kursus &amp; Instruktur</th>
              <th className="py-3 px-4 font-semibold">Tingkat &amp; Harga</th>
              <th className="py-3 px-4 font-semibold">Modul &amp; Siswa</th>
              <th className="py-3 px-4 font-semibold">Publikasi</th>
              <th className="py-3 px-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filtered.map((course) => (
              <tr key={course.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900 dark:text-white">{course.title}</div>
                  <div className="text-[11px] text-slate-400">{course.instructor_name}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-semibold">{formatIDR(course.price_idr)}</span>
                  <div className="text-[10px] text-slate-400 capitalize">{course.level}</div>
                </td>
                <td className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => setManagingCourse(course)}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    <span>{course.lesson_count} Modul</span>
                  </button>
                  <div className="text-[11px] text-slate-400">{course.student_count} Siswa Terdaftar</div>
                </td>
                <td className="py-3.5 px-4">
                  {course.is_published ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      <CheckCircle className="h-3 w-3" /> Tayang
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      <EyeOff className="h-3 w-3" /> Draft
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" onClick={() => setManagingCourse(course)} title="Kelola Modul" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                      <BookOpen className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => { setEditingCourse(course); setIsFormOpen(true); }} title="Edit Kursus" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(course)} title="Hapus Kursus" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CourseFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingCourse(null); }}
        courseToEdit={editingCourse}
        onSubmit={async (data) => {
          if (editingCourse) await onUpdateCourse(editingCourse.id, data);
          else await onCreateCourse(data);
        }}
        isLoading={isLoading}
      />

      {managingCourse && (
        <LessonManagerModal
          course={managingCourse}
          isOpen={Boolean(managingCourse)}
          onClose={() => setManagingCourse(null)}
        />
      )}
    </div>
  );
}
