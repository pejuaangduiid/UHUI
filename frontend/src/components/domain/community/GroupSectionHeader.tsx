"use client";

import React from "react";
import { Eye, PlusCircle, Users2 } from "lucide-react";
import type { components } from "@/types/api";

type Group = components["schemas"]["CommunityGroupDTO"];

interface GroupSectionHeaderProps {
  activeGroup?: Group;
  isMember: boolean;
  isCreating: boolean;
  onToggleCreate: () => void;
  onJoinGroup: () => void;
  isJoining: boolean;
  onLeaveGroup?: () => void;
  isLeaving?: boolean;
}

export function GroupSectionHeader({
  activeGroup,
  isMember,
  isCreating,
  onToggleCreate,
  onJoinGroup,
  isJoining,
  onLeaveGroup,
  isLeaving,
}: GroupSectionHeaderProps) {
  return (
    <div className="space-y-4">
      {activeGroup && !isMember && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
            <Eye className="h-4 w-4 text-blue-500 shrink-0" />
            <span>Anda sedang melihat postingan grup ini. Gabung ke grup untuk mulai membuat postingan.</span>
          </div>
          <button
            type="button"
            onClick={onJoinGroup}
            disabled={isJoining}
            className="px-3.5 py-1.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition shrink-0 text-xs shadow-sm"
          >
            {isJoining ? "Bergabung..." : "Gabung Grup"}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {activeGroup ? `Diskusi di ${activeGroup.name}` : "Daftar Topik Komunitas"}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {activeGroup
              ? isMember
                ? "Anda anggota aktif grup ini. Tulis topik baru atau beri solusi."
                : "Mode pratinjau. Bergabung ke grup untuk mulai membuat postingan."
              : "Ruang diskusi interaktif pelaku usaha, mentor SAK EMKM, dan investor."}
          </p>
        </div>
          {!activeGroup ? (
        <button
          type="button"
          onClick={onToggleCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{isCreating ? "Tutup Form" : "+ Buat Postingan Baru"}</span>
        </button>
        ) : isMember ? (
        <div className="flex items-center gap-2">
          {onLeaveGroup && (
            <button
              type="button"
              onClick={onLeaveGroup}
              disabled={isLeaving}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition shrink-0"
            >
              <span>{isLeaving ? "Keluar..." : "Keluar Grup"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isCreating ? "Tutup Form" : "+ Buat Postingan Baru"}</span>
          </button>
        </div>
        ) : (
        <button
          type="button"
          onClick={onJoinGroup}
          disabled={isJoining}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition shrink-0"
        >
          <Users2 className="h-4 w-4" />
          <span>{isJoining ? "Bergabung..." : "Gabung ke Grup"}</span>
        </button>
        )}
      </div>
    </div>
  );
}

