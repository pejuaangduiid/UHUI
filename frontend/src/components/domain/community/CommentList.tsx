"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/dates";
import { Send, Loader2, MessageSquare, Trash2 } from "lucide-react";
import type { components } from "@/types/api";

type Comment = components["schemas"]["CommentDTO"];

interface CommentListProps {
  comments: Comment[];
  onSubmitComment: (content: string) => void;
  isLoading?: boolean;
  onAdminDeleteComment?: (commentId: string, reason: string) => void;
}

export function CommentList({
  comments,
  onSubmitComment,
  isLoading = false,
  onAdminDeleteComment,
}: CommentListProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmitComment(content.trim());
    setContent("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]/90 backdrop-blur-md space-y-3">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <MessageSquare className="h-6 w-6 mx-auto text-slate-400/60" />
            <p>Belum ada tanggapan pada diskusi ini. Jadilah yang pertama memberikan masukan!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06] space-y-3">
            {comments.map((c) => {
              const initials = (c.author_name || "U").slice(0, 2).toUpperCase();
              return (
                <div key={c.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-500 font-bold text-[10px] flex items-center justify-center">
                        {initials}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{c.author_name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                        {c.author_role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{formatDate(c.created_at)}</span>
                      {onAdminDeleteComment && !c.is_deleted_by_admin && (
                        <button
                          type="button"
                          onClick={() => {
                            const r = window.prompt("Alasan penghapusan komentar oleh Admin:", "Melanggar tata tertib");
                            if (r && r.trim()) onAdminDeleteComment(c.id, r.trim());
                          }}
                          className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-0.5"
                          title="Hapus Komentar (Admin)"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Hapus Admin</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {c.is_deleted_by_admin ? (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400 ml-8">
                      <p className="font-semibold">⚠️ Komentar ini telah dihapus oleh Admin</p>
                      {c.admin_delete_reason && (
                        <p className="text-[11px] opacity-80 mt-0.5">Alasan: {c.admin_delete_reason}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-8 whitespace-pre-line">
                      {c.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis balasan atau solusi Anda..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-[#0f1420] dark:text-white"
        />
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          <span>{isLoading ? "Mengirim..." : "Kirim"}</span>
        </button>
      </form>
    </div>
  );
}
