import React from "react";
import { ThreadCard } from "./ThreadCard";
import { MessageSquareDashed } from "lucide-react";
import type { components } from "@/types/api";

type Thread = components["schemas"]["ThreadDTO"];

interface ThreadListProps {
  threads: Thread[];
  isLoading?: boolean;
  onSelect?: (thread: Thread) => void;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  onSelectGroup?: (groupSlug: string) => void;
  currentUserId?: string;
  onEdit?: (thread: Thread) => void;
  onDelete?: (threadId: string) => void;
}

export function ThreadList({
  threads,
  isLoading = false,
  onSelect,
  emptyMessage = "Belum ada postingan diskusi pada kategori ini.",
  emptyAction,
  onSelectGroup,
  currentUserId,
  onEdit,
  onDelete,
}: ThreadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-slate-200/80 bg-slate-100/60 dark:border-white/[0.06] dark:bg-[#121827]/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.1] p-10 text-center bg-slate-50/50 dark:bg-[#121827]/30 space-y-3">
        <MessageSquareDashed className="h-8 w-8 mx-auto text-slate-400" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Tidak ada diskusi ditemukan</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{emptyMessage}</p>
        {emptyAction && <div className="pt-2">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((t) => (
        <ThreadCard
          key={t.id}
          thread={t}
          onSelect={onSelect}
          onSelectGroup={onSelectGroup}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
