"use client";

import React, { useState } from "react";
import { X, MessageSquarePlus, Send } from "lucide-react";
import { useCreateBoardroomThread } from "@/hooks/use-bursa-trading";

interface CreateTopicModalProps {
  campaignSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTopicModal({ campaignSlug, isOpen, onClose }: CreateTopicModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createThread = useCreateBoardroomThread(campaignSlug);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) return;
    createThread.mutate(
      {
        title: title.trim(),
        content: content.trim(),
      },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#121827] text-slate-900 dark:text-white space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Buka Topik Diskusi Baru</h3>
              <p className="text-xs text-slate-400">Mulai agenda atau topik pembahasan pemegang saham</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Judul Topik / Agenda Pembahasan
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth. Rencana Ekspansi Kuartal Berikutnya & Kebijakan Dividen"
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Isi Pembahasan
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Jelaskan secara rinci topik yang ingin dibahas bersama pemilik usaha dan sesama investor..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 transition"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={createThread.isPending || !title.trim() || !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{createThread.isPending ? "Menerbitkan..." : "Buka Topik Sekarang"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
