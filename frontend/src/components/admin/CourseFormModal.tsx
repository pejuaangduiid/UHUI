"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, X } from "lucide-react";
import type { components } from "@/types/api";

type CourseAdminDTO = components["schemas"]["CourseAdminDTO"];
type CreateCourseInput = components["schemas"]["CreateCourseInput"];

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: CourseAdminDTO | null;
  onSubmit: (data: CreateCourseInput) => Promise<void>;
  isLoading: boolean;
}

export function CourseFormModal({ isOpen, onClose, courseToEdit, onSubmit, isLoading }: CourseFormModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [price, setPrice] = useState(0);
  const [level, setLevel] = useState("pemula");
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.title);
      setSlug(courseToEdit.slug);
      setDescription(courseToEdit.description);
      setInstructor(courseToEdit.instructor_name);
      setPrice(courseToEdit.price_idr);
      setLevel(courseToEdit.level);
      setIsPublished(courseToEdit.is_published);
    } else {
      setTitle(""); setSlug(""); setDescription(""); setInstructor(""); setPrice(0); setLevel("pemula"); setIsPublished(true);
    }
  }, [courseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!courseToEdit) setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, slug, description, instructor_name: instructor, price_idr: Number(price), level, is_published: isPublished });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121827] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><BookOpen className="h-4 w-4" /></div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{courseToEdit ? "Edit Kursus LMS" : "Buat Kursus Baru"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Judul Kursus *</label>
            <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Standar Pembukuan Kasir UMKM" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Slug URL *</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-white font-mono text-[11px]" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Instruktur / Pemateri *</label>
              <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="Nama Pengajar" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Harga (IDR) *</label>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Tingkat Kesulitan</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-white capitalize">
                <option value="pemula">Pemula</option><option value="menengah">Menengah</option><option value="lanjutan">Lanjutan</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Deskripsi Lengkap *</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rangkuman materi dan manfaat pembelajaran bagi UMKM..." required className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-white" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="is_published" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
            <label htmlFor="is_published" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">Publikasikan Kursus Ini Langsung</label>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Batal</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md shadow-blue-500/25 transition disabled:opacity-50">
              {isLoading ? "Menyimpan..." : courseToEdit ? "Simpan Perubahan" : "Buat Kursus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
