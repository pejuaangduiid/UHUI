"use client";

import React, { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useBoardroomThreads, useCreateBoardroomThread } from "@/hooks/use-boardroom";
import { useThreadComments, useCreateComment } from "@/hooks/use-hub";
import { ThreadList } from "@/components/domain/community/ThreadList";
import { ThreadForm } from "@/components/domain/community/ThreadForm";
import { CommentList } from "@/components/domain/community/CommentList";
import { AccessDenied } from "@/components/domain/community/AccessDenied";
import { VoteButton } from "@/components/domain/community/VoteButton";
import { Lock, ArrowLeft, MessageSquare } from "lucide-react";
import { formatUserRole } from "@/lib/roles";
import type { components } from "@/types/api";

type Thread = components["schemas"]["ThreadDTO"];

export default function SmeBoardroomPage() {
  const { smeId } = useSession();
  const { data: threads, isLoading, error } = useBoardroomThreads(smeId);
  const createThread = useCreateBoardroomThread(smeId);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const { data: comments } = useThreadComments(selectedThread?.id ?? "");
  const createComment = useCreateComment(selectedThread?.id ?? "");

  if (error) {
    return <AccessDenied businessName="Usaha Anda" />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-white/[0.07] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Ruang Rapat Pemegang Saham (Boardroom)
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
              <Lock className="h-3 w-3" /> Privat
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kanal komunikasi transparan dan diskusi strategis antara pemilik usaha dan investor terkonfirmasi.
          </p>
        </div>
      </div>

      {selectedThread ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedThread(null)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Diskusi Ruang Rapat
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">{selectedThread.author_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    {formatUserRole(selectedThread.author_role)}
                  </span>
              </div>
              <VoteButton
                threadId={selectedThread.id}
                upvotesCount={selectedThread.upvotes_count}
                hasVoted={selectedThread.has_voted}
              />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{selectedThread.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {selectedThread.content}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" /> Tanggapan ({comments?.length ?? 0})
            </h3>
            <CommentList
              comments={comments ?? []}
              onSubmitComment={(text) => createComment.mutate(text)}
              isLoading={createComment.isPending}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ThreadForm
            onSubmit={(data) => createThread.mutate(data)}
            isLoading={createThread.isPending}
            showKindSelect={false}
            placeholderTitle="Judul laporan atau topik pembahasan pemegang saham..."
            placeholderContent="Bagikan perkembangan kinerja, rencana operasional, atau agenda voting..."
          />

          <ThreadList
            threads={threads ?? []}
            isLoading={isLoading}
            onSelect={(t) => setSelectedThread(t)}
            emptyMessage="Belum ada topik diskusi di ruang rapat ini."
          />
        </div>
      )}
    </div>
  );
}
