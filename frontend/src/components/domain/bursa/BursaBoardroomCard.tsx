"use client";

import React from "react";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";

interface BursaBoardroomCardProps {
  hasAccess?: boolean;
  onOpenBoardroom: () => void;
}

export function BursaBoardroomCard({ hasAccess, onOpenBoardroom }: BursaBoardroomCardProps) {
  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-purple-900/20 p-5 shadow-sm text-left space-y-3">
      <div className="flex items-center gap-2">
        {hasAccess ? <ShieldCheck className="h-4 w-4 text-blue-400" /> : <Lock className="h-4 w-4 text-amber-400" />}
        <span className="text-xs font-bold text-white">Ruang Rapat Pemegang Saham</span>
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        {hasAccess
          ? "Anda telah memegang saham UMKM ini. Masuk ke ruang rapat untuk berdiskusi langsung dengan dewan direksi."
          : "Forum privat pemegang saham & dewan direksi. Beli saham minimal 1 lot untuk membuka akses diskusi."}
      </p>
      <button
        type="button"
        onClick={onOpenBoardroom}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white transition"
      >
        <span>{hasAccess ? "Masuk Ruang Rapat" : "Lihat Ketentuan Akses"}</span>
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

