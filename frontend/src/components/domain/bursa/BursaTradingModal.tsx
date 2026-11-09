"use client";

import React, { useState } from "react";
import { formatIDR } from "@/lib/money";
import { useInvest } from "@/hooks/use-invest";
import { useSellShares } from "@/hooks/use-bursa-trading";
import { X, CheckCircle2 } from "lucide-react";

interface BursaTradingModalProps {
  campaignId: string;
  campaignTitle: string;
  minInvestmentIdr: number;
  isOpen: boolean;
  onClose: () => void;
}

export function BursaTradingModal({
  campaignId,
  campaignTitle,
  minInvestmentIdr,
  isOpen,
  onClose,
}: BursaTradingModalProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState<number>(minInvestmentIdr || 100000);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const investMutation = useInvest();
  const sellMutation = useSellShares();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    if (mode === "buy") {
      investMutation.mutate(
        { campaignId, amountIdr: amount },
        {
          onSuccess: () => {
            setIsSuccess(true);
            setSuccessMsg("Pembelian saham berhasil! Hak akses Ruang Rapat Pemegang Saham kini telah terbuka.");
          },
        }
      );
    } else {
      sellMutation.mutate(
        { campaignId, amountIdr: amount },
        {
          onSuccess: (data) => {
            setIsSuccess(true);
            setSuccessMsg(data?.message || "Order jual simulasi berhasil dieksekusi.");
          },
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#121827] space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              {mode === "buy" ? "Beli Saham UMKM" : "Jual / Likuidasi Saham"}
            </h3>
            <p className="text-xs text-slate-400">{campaignTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto" />
            <p className="font-bold text-sm text-slate-900 dark:text-white">{successMsg}</p>
            <button
              type="button"
              onClick={() => { setIsSuccess(false); onClose(); }}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-blue-500 transition"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("buy")}
                className={`py-2 text-xs font-bold rounded-lg transition ${mode === "buy" ? "bg-[#1D5FAE] text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
              >
                Beli (Investasi)
              </button>
              <button
                type="button"
                onClick={() => setMode("sell")}
                className={`py-2 text-xs font-bold rounded-lg transition ${mode === "sell" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
              >
                Jual (Likuidasi)
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Nominal Transaksi (IDR)</label>
              <input
                type="number"
                step="50000"
                min={minInvestmentIdr || 50000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-800/50 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400">Estimasi Terbilang: {formatIDR(amount)}</p>
            </div>

            <button
              type="submit"
              disabled={investMutation.isPending || sellMutation.isPending}
              className={`w-full py-3 rounded-xl font-bold text-xs text-white transition shadow-lg ${mode === "buy"
                  ? "bg-[#1D5FAE] hover:bg-[#184e91] shadow-blue-500/20"
                  : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/20"
                }`}
            >
              {investMutation.isPending || sellMutation.isPending
                ? "Memproses Order..."
                : mode === "buy" ? "Konfirmasi Beli Saham (Simulasi)" : "Konfirmasi Jual Saham"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

