"use client";

import React from "react";
import { PlusCircle, PenSquare } from "lucide-react";

interface ComposerBarProps {
  userInitials: string;
  activeGroupName?: string;
  onOpen: () => void;
}

export function ComposerBar({
  userInitials,
  activeGroupName,
  onOpen,
}: ComposerBarProps) {
  return (
    <div
      onClick={onOpen}
      className="group rounded-3xl border border-slate-200/80 bg-white/95 p-3.5 sm:p-4 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer dark:border-white/[0.08] dark:bg-[#121827]/95 backdrop-blur-md flex items-center gap-3"
    >
      <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
        {userInitials || "U"}
      </div>
      <div className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700/70 transition flex items-center justify-between gap-2">
        <span className="truncate">
          {activeGroupName
            ? `Tulis sesuatu di ${activeGroupName}...`
            : "Apa yang sedang Anda pikirkan? Bagikan insight atau buat diskusi..."}
        </span>
        <PenSquare className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition shrink-0" />
      </div>
      <button
        type="button"
        className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 group-hover:from-blue-500 group-hover:to-indigo-500 transition shrink-0"
      >
        <PlusCircle className="h-4 w-4" />
        <span>Tulis</span>
      </button>
    </div>
  );
}

