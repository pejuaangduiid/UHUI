"use client";

import React, { useState } from "react";
import { ArrowRightLeft, FileText } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useTransactions } from "@/hooks/use-transactions";
import { TxRow, type TransactionData } from "@/components/transactions/TxRow";
import { ReverseDialog } from "@/components/transactions/ReverseDialog";

export default function TransactionsPage() {
  const { smeId } = useSession();
  const { transactions, isLoading, reverseTx } = useTransactions(smeId);
  const [filterType, setFilterType] = useState<string>("all");
  const [reversingTx, setReversingTx] = useState<TransactionData | null>(null);

  const reversedIds = new Set(
    transactions
      .filter((t) => t.reverses_tx_id)
      .map((t) => t.reverses_tx_id as string)
  );

  const filtered = transactions.filter((t) => {
    if (filterType === "all") return true;
    return t.tx_type === filterType;
  });

  const handleConfirmReverse = async (txId: string, reason: string) => {
    await reverseTx.mutateAsync({ txId, reason });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E7EB] dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DFE9F1] dark:bg-blue-950/60 text-[#1D5FAE] dark:text-blue-300">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
              Riwayat Transaksi Operasional
            </h1>
            <p className="text-xs text-[#516072] dark:text-slate-400">
              Jurnal pembukuan append-only terstandar SAK EMKM dengan nomor bukti transaksi permanen.
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="inline-flex rounded-xl border border-[#E2E7EB] bg-[#F4F3F1] p-1 dark:border-white/[0.08] dark:bg-[#101E2E]">
          {[
            { id: "all", label: "Semua" },
            { id: "sale", label: "Penjualan" },
            { id: "expense", label: "Beban" },
            { id: "restock", label: "Restok" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${filterType === tab.id
                ? "bg-[#1D5FAE] text-white shadow-xs"
                : "text-[#516072] hover:text-[#0F1E2E] dark:text-slate-400 dark:hover:text-white"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-xs text-[#516072] dark:text-slate-400">
          Memuat riwayat transaksi kasir...
        </div>
      ) : filtered.length === 0 ? (
        <div className="stitch-card flex h-48 flex-col items-center justify-center p-8 text-center border-dashed">
          <FileText className="h-8 w-8 text-[#516072] opacity-40 mb-2" />
          <span className="text-sm font-bold text-[#0F1E2E] dark:text-white">
            Belum Ada Transaksi Tercatat
          </span>
          <p className="text-xs text-[#516072] dark:text-slate-400 mt-0.5">
            Gunakan Kasir POS atau Pindai Nota untuk mencatat transaksi keuangan pertama Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t) => (
            <TxRow
              key={t.id}
              tx={t}
              isReversed={reversedIds.has(t.id)}
              onReverse={(tx) => setReversingTx(tx)}
            />
          ))}
        </div>
      )}

      <ReverseDialog
        tx={reversingTx}
        isOpen={!!reversingTx}
        onClose={() => setReversingTx(null)}
        onConfirm={handleConfirmReverse}
      />
    </div>
  );
}
