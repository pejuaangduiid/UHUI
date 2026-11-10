"use client";

import React, { useState } from "react";
import { ArrowLeft, MessageSquare, Send, CheckCircle2, XCircle } from "lucide-react";
import { useThreadComments } from "@/hooks/use-hub";
import { useCreateBoardroomComment } from "@/hooks/use-bursa-trading";
import { formatUserRole } from "@/lib/roles";

export interface BoardroomThreadItem {
  id: string;
  author_name: string;
  author_role: string;
  title: string;
  content: string;
  comment_count: number;
  created_at: string | Date;
}

interface BoardroomDetailPaneProps {
  thread: BoardroomThreadItem | null;
  campaignSlug: string;
  isClosed: boolean;
  onToggleClosed: () => void;
  onBackMobile?: () => void;
}

export function BoardroomDetailPane({
  thread,
  campaignSlug,
  isClosed,
  onToggleClosed,
  onBackMobile,
}: BoardroomDetailPaneProps) {
  const [replyText, setReplyText] = useState("");
  const { data: comments, refetch } = useThreadComments(thread?.id ?? "");
  const createComment = useCreateBoardroomComment(campaignSlug);

  if (!thread) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-[#121827] text-slate-400 space-y-2">
        <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Pilih Topik Pembahasan</p>
        <p className="text-xs max-w-xs">Pilih salah satu agenda di sebelah kiri untuk melihat rincian pembahasan dan berdiskusi.</p>
      </div>
    );
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isClosed) return;
    createComment.mutate(
      { threadId: thread.id, content: replyText.trim() },
      { onSuccess: () => { setReplyText(""); refetch(); } }
    );
  };

  const commentList = comments ?? [];

  return (
    <div className="h-[600px] flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#121827] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBackMobile && (
            <button type="button" onClick={onBackMobile} className="md:hidden p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{thread.title}</h3>
            <p className="text-[11px] text-slate-400 truncate">
              {thread.author_name} ({formatUserRole(thread.author_role)}) • {new Date(thread.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleClosed}
          className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition ${isClosed ? "text-blue-500 hover:bg-blue-500/10 border border-blue-500/20" : "text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-slate-200 dark:border-white/10"}`}
        >
          {isClosed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          <span>{isClosed ? "Buka Kembali" : "Tutup Topik"}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Pokok Pembahasan / Agenda</span>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{thread.content}</p>
        </div>

        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-900 dark:text-white block">Tanggapan Diskusi ({commentList.length})</span>
          {commentList.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              Belum ada tanggapan pada topik ini. Jadilah yang pertama memberikan masukan.
            </p>
          ) : (
            commentList.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.05] space-y-1 text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{c.author_name} ({formatUserRole(c.author_role)})</span>
                  <span>{new Date(c.created_at).toLocaleDateString("id-ID", { dateStyle: "short" })}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
        {!isClosed ? (
          <form onSubmit={handleSendReply} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis tanggapan atau masukan untuk agenda ini..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D5FAE]"
            />
            <button
              type="submit"
              disabled={createComment.isPending || !replyText.trim()}
              className="bg-[#1D5FAE] hover:bg-[#184e91] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Kirim</span>
            </button>
          </form>
        ) : (
          <p className="text-center text-xs text-slate-400 py-1.5 bg-slate-100 dark:bg-slate-800/40 rounded-xl">
            Topik ini telah ditutup. Pembahasan agenda rapat telah selesai.
          </p>
        )}
      </div>
    </div>
  );
}