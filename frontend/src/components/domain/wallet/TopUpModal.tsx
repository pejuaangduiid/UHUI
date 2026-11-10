"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatIDR } from "@/lib/money";
import { useWallet } from "@/hooks/use-wallet";
import { X, Wallet, CheckCircle, Sparkles } from "lucide-react";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [5_000_000, 10_000_000, 25_000_000, 50_000_000];

export function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
  const { balance, topUp, isTopUpPending } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number>(10_000_000);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleTopUp = async () => {
    if (selectedAmount <= 0) return;
    try {
      await topUp(selectedAmount);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch {

    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md my-auto max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#121827]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1D5FAE] text-white shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Isi Saldo Simulasi</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Saldo virtual sandbox untuk bursa &amp; kursus</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-white/[0.05] mb-5">
            <span className="text-[11px] text-slate-400 font-medium">Saldo Saat Ini</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{formatIDR(balance)}</div>
          </div>

          {success ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle className="h-10 w-10 text-[#1D5FAE] mx-auto animate-bounce" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Top Up Berhasil!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Saldo bertambah {formatIDR(selectedAmount)}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Pilih Nominal Tambahan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedAmount(amt)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${selectedAmount === amt
                          ? "border-[#1D5FAE] bg-[#DFE9F1] text-[#1D5FAE] dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      +{formatIDR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isTopUpPending}
                onClick={handleTopUp}
                className="w-full flex items-center justify-center gap-2 bg-[#1D5FAE] hover:bg-[#184e91] text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isTopUpPending ? "Memproses..." : `Top Up ${formatIDR(selectedAmount)}`}</span>
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
      );
}
