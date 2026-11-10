"use client";

import React from "react";
import { MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import type { BoardroomThreadItem } from "./BoardroomDetailPane";

interface BoardroomTopicListProps {
  threads: BoardroomThreadItem[];
  selectedId: string | null;
  closedIds: Record<string, boolean>;
  onSelect: (id: string) => void;
}

export function BoardroomTopicList({
  threads,
  selectedId,
  closedIds,
  onSelect,
}: BoardroomTopicListProps) {
  if (threads.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-[#121827]">
        Belum ada topik diskusi.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
      {threads.map((t) => {
        const isSelected = t.id === selectedId;
        const isClosed = Boolean(closedIds[t.id]);

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all ${isSelected
                ? "border-[#1D5FAE] bg-[#DFE9F1]/50 dark:bg-blue-950/40 shadow-sm ring-1 ring-[#1D5FAE]/30"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/[0.08] dark:bg-[#121827] dark:hover:border-white/20"
              }`}
          >
            <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">
                {t.author_name}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">
                {new Date(t.created_at).toLocaleDateString("id-ID", { dateStyle: "short" })}
              </span>
            </div>

            <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 mb-1">
              {t.title}
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
              {t.content}
            </p>

            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-white/[0.06]">
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                <MessageSquare className="h-3 w-3 text-[#1D5FAE]" />
                <span>{t.comment_count} Tanggapan</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${isClosed
                  ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    : "bg-[#DFE9F1] text-[#1D5FAE] border-[#B9C8DD]"
                  }`}
              >
              {isClosed ? <XCircle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
              <span>{isClosed ? "Ditutup" : "Aktif"}</span>
            </span>
          </div>
          </button>
  );
})}
    </div >
  );
}
