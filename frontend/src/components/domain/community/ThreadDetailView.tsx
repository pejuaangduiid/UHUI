"use client";

import React from "react";
import { ArrowLeft, MessageSquare, Globe, Users, Edit3, Trash2, AlertTriangle } from "lucide-react";
import { VoteButton } from "./VoteButton";
import { CommentList } from "./CommentList";
import { useThreadComments, useCreateComment } from "@/hooks/use-hub";
import { useSession } from "@/hooks/use-session";
import { useAdminCommunity } from "@/hooks/use-admin-community";
import { formatUserRole } from "@/lib/roles";
import type { components } from "@/types/api";

type Thread = components["schemas"]["ThreadDTO"];

interface ThreadDetailViewProps {
  thread: Thread;
  onBack: () => void;
  onSelectGroup?: (groupSlug: string) => void;
  currentUserId?: string;
  onEdit?: (thread: Thread) => void;
  onDelete?: (threadId: string) => void;
}

export function ThreadDetailView({
  thread,
  onBack,
  onSelectGroup,
  currentUserId,
  onEdit,
  onDelete,
}: ThreadDetailViewProps) {
  const { data: comments } = useThreadComments(thread.id);
  const createComment = useCreateComment(thread.id);
  const { role } = useSession();
  const { deleteComment } = useAdminCommunity();
  const isAuthor = Boolean(currentUserId && currentUserId === thread.author_id);
  const isAdmin = role === "admin" || role === "superadmin";

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1D5FAE] transition"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Semua Diskusi
      </button>

      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]/95 backdrop-blur-md space-y-4">
        {thread.is_deleted_by_admin && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Postingan ini telah dihapus oleh Admin
            </span>
            {thread.admin_delete_reason && (
              <p className="mt-1 text-[11px] opacity-90">Alasan: {thread.admin_delete_reason}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">{thread.author_name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
              {formatUserRole(thread.author_role)}
            </span>
            {thread.group_name ? (
              <button
                type="button"
                onClick={() => thread.group_slug && onSelectGroup?.(thread.group_slug)}
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#DFE9F1]/60 text-[#1D5FAE] hover:bg-[#DFE9F1] border border-[#B9C8DD] px-2 py-0.5 rounded-full transition"
              >
                <Users className="h-3 w-3" />
                <span>{thread.group_name}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                <Globe className="h-3 w-3" />
                <span>Global</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthor && (
              <div className="flex items-center gap-1 border-r border-slate-200 dark:border-white/10 pr-2">
                <button
                  type="button"
                  onClick={() => onEdit?.(thread)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#1D5FAE] transition"
                  title="Edit Postingan"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(thread.id)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition"
                  title="Hapus Postingan"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <VoteButton
              threadId={thread.id}
              upvotesCount={thread.upvotes_count}
              hasVoted={thread.has_voted}
            />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{thread.title}</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {thread.content}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#1D5FAE]" />
          <span>Tanggapan &amp; Solusi ({comments?.length ?? 0})</span>
        </h3>
        <CommentList
          comments={comments ?? []}
          onSubmitComment={(text) => createComment.mutate(text)}
          isLoading={createComment.isPending}
          onAdminDeleteComment={isAdmin ? (id, reason) => deleteComment.mutate({ id, reason }) : undefined}
        />
      </div>
    </div>
  );
}
