"use client";

import React, { useState } from "react";
import { formatIDR } from "@/lib/money";
import { useWallet } from "@/hooks/use-wallet";
import { Wallet, Plus } from "lucide-react";
import { TopUpModal } from "./TopUpModal";

interface WalletBadgeProps {
  compact?: boolean;
}

export function WalletBadge({ compact = false }: WalletBadgeProps) {
  const { balance } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 py-1 pl-2.5 pr-1.5 shadow-sm dark:border-white/10 dark:bg-[#121827]/80">
        <div className="flex items-center gap-1.5 text-xs">
          <Wallet className="h-3.5 w-3.5 text-[#1D5FAE]" />
          {!compact && <span className="text-[11px] text-slate-400 font-medium">Saldo:</span>}
          <span className="font-extrabold text-slate-900 dark:text-white">{formatIDR(balance)}</span>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          title="Top Up Saldo Simulasi"
          aria-label="Isi Saldo"
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1D5FAE] text-white hover:bg-[#184e91] transition shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <TopUpModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

