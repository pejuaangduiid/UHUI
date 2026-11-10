"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Lock, ShieldCheck, MessageSquare, PlusCircle } from "lucide-react";
import { useBoardroomAccess, useBoardroomThreads } from "@/hooks/use-bursa-trading";
import { useSession } from "@/hooks/use-session";
import { BoardroomTopicList } from "./BoardroomTopicList";
import { BoardroomDetailPane } from "./BoardroomDetailPane";
import { CreateTopicModal } from "./CreateTopicModal";

interface BursaBoardroomTabProps {
  campaignSlug: string;
  businessName: string;
  onOpenTradingModal: () => void;
  hasConfirmedAccess?: boolean;
}

export function BursaBoardroomTab({
  campaignSlug,
  businessName,
  onOpenTradingModal,
  hasConfirmedAccess,
}: BursaBoardroomTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();
  const { data: access, isLoading: loadingAccess, refetch: refetchAccess } = useBoardroomAccess(campaignSlug);
  const { data: threads, isLoading: loadingThreads } = useBoardroomThreads(campaignSlug);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [closedIds, setClosedIds] = useState<Record<string, boolean>>({});
  const [openCreateModal, setOpenCreateModal] = useState(false);

  useEffect(() => {
    if (hasConfirmedAccess && !access?.can_access) {
      refetchAccess();
    }
  }, [hasConfirmedAccess, access?.can_access, refetchAccess]);

  if (loadingAccess) {
    return <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  const canAccess = Boolean(access?.can_access || hasConfirmedAccess);

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto shadow-inner">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Ruang Rapat Pemegang Saham Terkunci 🔒
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {(!isAuthenticated || !user)
              ? "Silakan masuk terlebih dahulu untuk mengakses Ruang Rapat Pemegang Saham."
              : (access?.message || `Ruang Rapat Pemegang Saham bersifat privat. Anda harus memiliki porsi saham terkonfirmasi pada ${businessName} untuk membuka agenda rapat dan diskusi internal.`)}
          </p>
        </div>
        {(!isAuthenticated || !user) ? (
            <button type="button" onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)} className="inline-flex items-center gap-2 bg-[#1D5FAE] hover:bg-[#184e91] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm">
              <span>Masuk ke Akun</span>
            </button>
            ) : (
              <button type="button" onClick={onOpenTradingModal} className="inline-flex items-center gap-2 bg-[#1D5FAE] hover:bg-[#184e91] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm">
                <span>Miliki Saham Sekarang</span>
              </button>
        )}
            </div>
            );
  }

            const threadList = threads ?? [];
            const effectiveSelectedId = selectedId ?? threadList[0]?.id ?? null;
  const activeThread = threadList.find((t) => t.id === effectiveSelectedId) ?? null;

  const toggleClosed = (id: string) => {
              setClosedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

            return (
            <div className="space-y-4">
                  <div className="rounded-2xl border border-[#B9C8DD] bg-[#DFE9F1]/40 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1D5FAE]">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Status Akses Terkonfirmasi • Pemegang Saham Resmi</span>
                    </div>
                      <span className="text-[11px] bg-[#DFE9F1] text-[#1D5FAE] px-2.5 py-0.5 rounded-full font-bold">
                        {access?.is_owner ? "Pemilik Usaha" : "Investor Terdaftar"}
                      </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#1D5FAE]" />
                        <span>Forum &amp; Agenda Rapat Pemegang Saham ({threadList.length})</span>
                      </h3>
                      <p className="text-xs text-slate-400">Pilih topik di sebelah kiri untuk melihat jalannya musyawarah.</p>
                    </div>

                      <button type="button" onClick={() => setOpenCreateModal(true)} className="inline-flex items-center gap-1.5 bg-[#1D5FAE] hover:bg-[#184e91] text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm shrink-0">
                        <PlusCircle className="h-4 w-4" />
                        <span>Buka Topik Baru</span>
                      </button>
                  </div>

                  {loadingThreads ? (
                    <div className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className={`md:col-span-5 ${selectedId ? "hidden md:block" : "block"}`}>
                        <BoardroomTopicList threads={threadList} selectedId={effectiveSelectedId} closedIds={closedIds} onSelect={(id) => setSelectedId(id)} />
                      </div>

                      <div className={`md:col-span-7 ${!selectedId ? "hidden md:block" : "block"}`}>
                        <BoardroomDetailPane thread={activeThread} campaignSlug={campaignSlug} isClosed={Boolean(activeThread && closedIds[activeThread.id])} onToggleClosed={() => activeThread && toggleClosed(activeThread.id)} onBackMobile={() => setSelectedId(null)} />
                      </div>
                    </div>
                  )}

                  <CreateTopicModal campaignSlug={campaignSlug} isOpen={openCreateModal} onClose={() => setOpenCreateModal(false)} />
                </div>
                );
}