"use client";

import React, { useState } from "react";
import { BookOpen, Plus, Trash2, X, Clock, Edit2 } from "lucide-react";
import { useAdminLessons } from "@/hooks/use-admin-courses";
import type { components } from "@/types/api";

type CourseAdminDTO = components["schemas"]["CourseAdminDTO"];
type LessonAdminDTO = components["schemas"]["LessonAdminDTO"];

interface LessonManagerModalProps {
  course: CourseAdminDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function LessonManagerModal({ course, isOpen, onClose }: LessonManagerModalProps) {
  const { lessons, isLoading, createLesson, updateLesson, deleteLesson } = useAdminLessons(course.id);
  const [editingLesson, setEditingLesson] = useState<LessonAdminDTO | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(15);
  const [content, setContent] = useState("");

  if (!isOpen) return null;

  const handleStartEdit = (l: LessonAdminDTO) => {
    setEditingLesson(l);
    setTitle(l.title);
    setDuration(l.duration_minutes);
    setContent(l.content_text || "");
  };

  const handleResetForm = () => {
    setEditingLesson(null);
    setTitle("");
    setDuration(15);
    setContent("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLesson) {
      await updateLesson.mutateAsync({
        id: editingLesson.id,
        input: { title, duration_minutes: Number(duration), content_text: content, sort_order: editingLesson.sort_order, video_url: "" },
      });
    } else {
      await createLesson.mutateAsync({
        title,
        duration_minutes: Number(duration),
        content_text: content,
        sort_order: lessons.length + 1,
        video_url: "",
      });
    }
    handleResetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121827] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DFE9F1] text-[#1D5FAE] dark:bg-blue-950/60 dark:text-blue-300"><BookOpen className="h-4 w-4" /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kelola Modul: {course.title}</h3>
              <p className="text-[11px] text-slate-400">Total {lessons.length} modul bacaan terdaftar</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.05] space-y-3 text-xs">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-[#1D5FAE]" />
            <span>{editingLesson ? "Edit Modul Bacaan" : "Tambah Modul Bacaan Baru"}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul Modul..." required className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 outline-none focus:border-[#1D5FAE] dark:border-white/10 dark:bg-[#101624] dark:text-white" />
            <div className="flex items-center gap-1.5">
              <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} placeholder="Menit" required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 outline-none focus:border-[#1D5FAE] dark:border-white/10 dark:bg-[#101624] dark:text-white" />
              <span className="text-[11px] text-slate-400">m</span>
            </div>
          </div>
          <textarea rows={2} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Isi materi bacaan teks terstandar..." required className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-[#1D5FAE] dark:border-white/10 dark:bg-[#101624] dark:text-white" />
          <div className="flex justify-end gap-2">
            {editingLesson && <button type="button" onClick={handleResetForm} className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">Batal Edit</button>}
              <button type="submit" disabled={createLesson.isPending || updateLesson.isPending} className="px-4 py-1.5 rounded-lg bg-[#1D5FAE] hover:bg-[#184e91] font-bold text-white shadow-sm transition disabled:opacity-50">
                {editingLesson ? "Simpan Modul" : "+ Tambah Modul"}
              </button>
          </div>
        </form>

        <div className="space-y-2 text-xs">
          <h4 className="font-semibold text-slate-500 dark:text-slate-400">Daftar Modul Saat Ini:</h4>
          {isLoading ? (
            <div className="py-6 text-center text-slate-400">Memuat modul kursus...</div>
          ) : lessons.length === 0 ? (
            <div className="py-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">Belum ada modul. Tambahkan modul pertama di atas!</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden bg-white dark:bg-[#101624]">
              {lessons.map((l, idx) => (
                <div key={l.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">{idx + 1}</span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{l.title}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{l.content_text}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" />{l.duration_minutes}m</span>
                    <button type="button" onClick={() => handleStartEdit(l)} className="p-1.5 rounded-lg text-[#1D5FAE] hover:bg-[#DFE9F1] dark:hover:bg-blue-950/40"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => deleteLesson.mutate(l.id)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

