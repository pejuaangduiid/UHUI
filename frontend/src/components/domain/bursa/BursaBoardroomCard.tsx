"use client";

import React from "react";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";

interface BursaBoardroomCardProps {
  hasAccess?: boolean;
  onOpenBoardroom: () => void;
}

export function BursaBoardroomCard({ hasAccess, onOpenBoardroom }: BursaBoardroomCardProps) {
  return (
      <div className="rounded-2xl border border-[#B9C8DD] dark:border-blue-900/50 bg-[#DFE9F1]/60 dark:bg-blue-950/40 p-5 shadow-xs text-left space-y-2.5">
        <div className="flex items-center gap-2">
          {hasAccess ? <ShieldCheck className="h-4 w-4 text-[#1D5FAE] dark:text-blue-400" /> : <Lock className="h-4 w-4 text-amber-500" />}
          <span className="text-xs font-bold text-[#0F1E2E] dark:text-white">Ruang Rapat Pemegang Saham</span>
        </div>
          <p className="text-xs text-[#516072] dark:text-slate-300 leading-relaxed">
            {hasAccess
              ? "Anda telah memegang saham UMKM ini. Masuk ke ruang rapat untuk berdiskusi langsung dengan dewan direksi."
              : "Forum privat pemegang saham & dewan direksi. Beli saham minimal 1 lot untuk membuka akses diskusi."}
          </p>
          <button
            type="button"
            onClick={onOpenBoardroom}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5FAE] hover:text-[#184e91] dark:text-blue-300 dark:hover:text-blue-200 transition"
          >
            <span>{hasAccess ? "Masuk Ruang Rapat" : "Lihat Ketentuan Akses"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
      </div>
      );
}

