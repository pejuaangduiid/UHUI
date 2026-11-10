"use client";

import React from "react";
import { PlusCircle, Users2, CheckCircle2, Eye } from "lucide-react";
import type { components } from "@/types/api";

type Group = components["schemas"]["CommunityGroupDTO"];

interface CommunityHeaderProps {
  activeGroup?: Group;
  isMember: boolean;
  isCreating: boolean;
  onToggleCreate: () => void;
  onJoinGroup: () => void;
  isJoining: boolean;
  onLeaveGroup?: () => void;
  isLeaving?: boolean;
  kindFilter: string;
  onSelectKind: (kind: string) => void;
}

export function CommunityHeader({
  activeGroup,
  isMember,
  isCreating,
  onToggleCreate,
  onJoinGroup,
  isJoining,
  onLeaveGroup,
  isLeaving,
  kindFilter,
  onSelectKind,
}: CommunityHeaderProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:from-[#121827] dark:via-[#121827] dark:to-[#172033]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1D5FAE] uppercase tracking-wider mb-1.5">
              <Users2 className="h-4 w-4" />
              <span>Forum Ekosistem Bisnis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {activeGroup ? activeGroup.name : "Komunitas & Solusi UMKM"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              {activeGroup ? activeGroup.description : "Ruang diskusi interaktif pelaku usaha, mentor SAK EMKM, dan investor untuk bertukar strategi, solusi taktis, dan tantangan bisnis."}
            </p>
          </div>

          {activeGroup ? (
            isMember ? (
              <button
                type="button"
                onClick={onToggleCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isCreating ? "Tutup Form Diskusi" : `Tulis di ${activeGroup.name}`}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onJoinGroup}
                disabled={isJoining}
                className="inline-flex items-center gap-2 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] px-4 py-2.5 text-xs font-semibold text-white shadow-sm active:scale-[0.985] transition shrink-0"
              >
                <Users2 className="h-4 w-4" />
                <span>{isJoining ? "Bergabung..." : "Gabung Grup untuk Memposting"}</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onToggleCreate}
              className="inline-flex items-center gap-2 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] px-4 py-2.5 text-xs font-semibold text-white shadow-sm active:scale-[0.985] transition shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{isCreating ? "Tutup Form Diskusi" : "Tulis Topik Baru"}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-200/60 dark:border-white/[0.06]">
          <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs">
            {
              [
                { id: "", label: "Semua Topik" },
                { id: "discussion", label: "Diskusi Bebas" },
                { id: "my_posts", label: "Postingan Saya" },
              ].map((k) => (
                <button
                  key={k.id}
                  onClick={() => onSelectKind(k.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${kindFilter === k.id ? "bg-white dark:bg-slate-700 text-[#1D5FAE] dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
                >
                  {k.label}
                </button>
              ))
            }
          </div>

          {activeGroup && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Status:</span>
              {isMember ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-bold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Anggota (Bisa Buat Postingan)</span>
                  </span>
                  {onLeaveGroup && (
                    <button
                      type="button"
                      onClick={onLeaveGroup}
                      disabled={isLeaving}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition underline underline-offset-2 ml-1"
                    >
                      {isLeaving ? "Keluar..." : "Keluar Grup"}
                    </button>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-slate-400 bg-slate-500/10 px-2.5 py-0.5 rounded-full border border-slate-500/20">
                  <Eye className="h-3 w-3" />
                  <span>Hanya Melihat</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      );
}

