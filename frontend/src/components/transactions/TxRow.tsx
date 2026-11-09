"use client";

import React from "react";
import { AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { formatIDR } from "@/lib/money";
import { formatWIB } from "@/lib/dates";

export interface TransactionData {
  id: string;
  tx_type: string;
  total_amount_idr: number;
  description: string;
  duplicate_suspect: boolean;
  is_ocr_verified: boolean;
  reverses_tx_id?: string | null;
  tx_date: string;
}

interface TxRowProps {
  tx: TransactionData;
  isReversed?: boolean;
  onReverse?: (tx: TransactionData) => void;
}

export function TxRow({ tx, isReversed = false, onReverse }: TxRowProps) {
  const isReversalRow = !!tx.reverses_tx_id;
  
  const canReverse = !isReversed && !isReversalRow && !!onReverse;

  const typeConfig: Record<string, { label: string; color: string }> = {
    sale: { label: "Penjualan", color: "text-[#1D5FAE] bg-[#DFE9F1] dark:bg-blue-950/40 dark:text-blue-300" },
    expense: { label: "Beban", color: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400" },
    restock: { label: "Restok", color: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400" },
  };

  const badge = typeConfig[tx.tx_type] ?? {
    label: tx.tx_type,
    color: "text-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <div
      data-testid={`tx-row-${tx.id}`}
      className={`flex items-center justify-between rounded-xl border p-4 transition ${
        isReversed || isReversalRow
          ? "border-zinc-200 bg-zinc-50/60 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/40"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${badge.color}`}>
              {badge.label}
            </span>
            {tx.is_ocr_verified && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                <CheckCircle2 className="h-3 w-3" /> OCR Terverifikasi
              </span>
            )}
            {tx.duplicate_suspect && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" /> Suspek Duplikat
              </span>
            )}
            {isReversalRow && (
              <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">
                Pembalikan
              </span>
            )}
            {isReversed && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Sudah Dibalik
              </span>
            )}
          </div>
          <span className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{tx.description}</span>
          <span className="text-xs text-zinc-400">{formatWIB(tx.tx_date, "full")}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span
          className={`text-sm font-bold ${
            tx.tx_type === "sale" ? "text-[#1D5FAE] dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
          }`}
        >
          {tx.tx_type === "sale" ? "+" : "-"}
          {formatIDR(tx.total_amount_idr)}
        </span>

        {canReverse && (
          <button
            type="button"
            data-testid={`reverse-button-${tx.id}`}
            onClick={() => onReverse(tx)}
            title="Balikkan transaksi"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

