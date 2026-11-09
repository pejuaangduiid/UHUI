"use client";

import React, { useState, useEffect } from "react";
import { MessageSquarePlus, Send, Loader2, AlertCircle } from "lucide-react";

interface ThreadFormProps {
  onSubmit: (data: { kind: string; title: string; content: string; targetGroupId?: string }) => void;
  isLoading?: boolean;
  showKindSelect?: boolean;
  placeholderTitle?: string;
  placeholderContent?: string;
  onCancel?: () => void;
  groups?: { id: string; name: string; is_member?: boolean }[];
  defaultGroupId?: string;
  errorMessage?: string;
}

export function ThreadForm({
  onSubmit,
  isLoading = false,
  showKindSelect = true,
  placeholderTitle = "Tulis judul diskusi atau topik pertanyaan...",
  placeholderContent = "Jelaskan konteks, tantangan yang dihadapi, atau solusi yang Anda butuhkan...",
  onCancel,
  groups,
  defaultGroupId = "",
  errorMessage,
}: ThreadFormProps) {
  const kind = "discussion";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetGroupId, setTargetGroupId] = useState(defaultGroupId);

  useEffect(() => {
    setTargetGroupId(defaultGroupId);
  }, [defaultGroupId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ kind, title: title.trim(), content: content.trim(), targetGroupId });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]/95 backdrop-blur-md space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
        {showKindSelect && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>Diskusi Terbuka</span>
            </div>
        )}

            {groups && groups.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold">Tujuan:</span>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 px-2.5 py-1.5 outline-none focus:border-blue-500"
                >
                  <option value="">🌐 Publik / Global</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} disabled={!g.is_member}>
                      {g.is_member ? `👥 ${g.name}` : `🔒 ${g.name} (Harus Gabung)`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onCancel && (
              <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-semibold">
                Tutup
              </button>
            )}
          </div>

      {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Judul Postingan *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholderTitle}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-[#0f1420] dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Isi Diskusi / Rincian Tantangan *</label>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholderContent}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs leading-relaxed text-slate-900 outline-none focus:border-blue-500 resize-none dark:border-white/[0.08] dark:bg-[#0f1420] dark:text-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white">
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !title.trim() || !content.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>{isLoading ? "Mengirim..." : "Kirim Postingan"}</span>
          </button>
        </div>
    </form>
  );
}
