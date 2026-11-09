"use client";

import React, { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import type { components } from "@/types/api";

type Thread = components["schemas"]["ThreadDTO"];

interface EditThreadModalProps {
  thread: Thread;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id: string; title: string; content: string }) => void;
  isLoading?: boolean;
}

export function EditThreadModal({
  thread,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: EditThreadModalProps) {
  const [title, setTitle] = useState(thread.title);
  const [content, setContent] = useState(thread.content);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({ id: thread.id, title: title.trim(), content: content.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121827] space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Postingan</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Judul Postingan</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-[#0f1420] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Isi Postingan</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs leading-relaxed text-slate-900 outline-none focus:border-blue-500 resize-none dark:border-white/[0.08] dark:bg-[#0f1420] dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white">
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim() || !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 hover:bg-blue-500 transition disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isLoading ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

