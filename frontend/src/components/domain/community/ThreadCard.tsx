import React from "react";
import { VoteButton } from "./VoteButton";
import { formatDate } from "@/lib/dates";
import { MessageSquare, Sparkles, Globe, Users, Edit3, Trash2 } from "lucide-react";
import type { components } from "@/types/api";

type Thread = components["schemas"]["ThreadDTO"];

interface ThreadCardProps {
  thread: Thread;
  onSelect?: (thread: Thread) => void;
  onSelectGroup?: (groupSlug: string) => void;
  currentUserId?: string;
  onEdit?: (thread: Thread) => void;
  onDelete?: (threadId: string) => void;
}

  export function ThreadCard({
    thread,
    onSelect,
    onSelectGroup,
    currentUserId,
    onEdit,
    onDelete,
  }: ThreadCardProps) {
    const hasAIReport = !!thread.attached_ai_report_id;
    const hasMetrics = !!thread.shared_metrics_json;
    const initials = (thread.author_name || "U").slice(0, 2).toUpperCase();
    const isAuthor = Boolean(currentUserId && currentUserId === thread.author_id);

          return (
          <div
            onClick={() => onSelect?.(thread)}
            className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer space-y-3 dark:border-white/[0.08] dark:bg-[#121827]/90 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                  {initials}
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{thread.author_name}</span>
                  <span className="text-[11px] text-slate-400 block">{formatDate(thread.created_at)}</span>
                </div>
              </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {thread.group_name && thread.group_slug ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGroup?.(thread.group_slug || "");
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full hover:bg-blue-500/20 transition"
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
          {hasAIReport && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    <Sparkles className="h-3 w-3" /> AI
                  </span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">
                {thread.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mt-1">
                {thread.content}
              </p>
            </div>

            {thread.is_deleted_by_admin && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                ⚠️ Dihapus oleh Admin{thread.admin_delete_reason ? `: "${thread.admin_delete_reason}"` : ""}
              </div>
            )}

            {hasMetrics && (
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/5 border border-blue-500/15 px-2.5 py-1 text-[11px] font-semibold text-blue-500 dark:text-blue-400">
          <span>📊</span>
          <span>Metrik Kinerja Terlampir</span>
        </div>
            )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div onClick={(e) => e.stopPropagation()}>
                  <VoteButton
                    threadId={thread.id}
                    upvotesCount={thread.upvotes_count}
                    hasVoted={thread.has_voted}
                  />
                </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{thread.comment_count} Komentar</span>
                    </div>

                  {isAuthor && (
                    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onEdit?.(thread)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition"
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
              </div>
            </div>
          </div>
          );
}
