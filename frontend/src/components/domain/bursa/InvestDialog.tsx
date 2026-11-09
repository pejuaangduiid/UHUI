"use client";

import React, { useState } from "react";
import { formatIDR } from "@/lib/money";
import { useInvest } from "@/hooks/use-invest";
import { useWallet } from "@/hooks/use-wallet";
import { CheckCircle2, AlertTriangle, X, Wallet } from "lucide-react";

interface InvestDialogProps {
  campaignId: string;
  campaignTitle: string;
  minInvestmentIdr: number;
  remainingAmountIdr: number;
  isOpen: boolean;
  onClose: () => void;
}

export function InvestDialog({
  campaignId,
  campaignTitle,
  minInvestmentIdr,
  remainingAmountIdr,
  isOpen,
  onClose,
}: InvestDialogProps) {
  const isRemainderOnly = remainingAmountIdr < minInvestmentIdr;
  const initialAmount = isRemainderOnly ? remainingAmountIdr : minInvestmentIdr;

  const [amount, setAmount] = useState(initialAmount);
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState(false);
  const investMutation = useInvest();
  const { balance } = useWallet();
  const isInsufficient = amount > balance;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed || amount <= 0) return;

    investMutation.mutate(
      { campaignId, amountIdr: amount },
      {
        onSuccess: () => setSuccess(true),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card text-card-foreground border rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in-50 zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto" />
            <h3 className="text-lg font-bold">Investasi Simulasi Berhasil!</h3>
            <p className="text-xs text-muted-foreground">
              Investasi sebesar <strong>{formatIDR(amount)}</strong> pada {campaignTitle} telah dicatat dalam portofolio simulasi Anda.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Lihat Portofolio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold">Investasi Simulasi</h3>
            <p className="text-xs text-muted-foreground">{campaignTitle}</p>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200 flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Sandbox Edukasi: Transaksi ini bersifat virtual/simulasi. Tidak ada pemotongan uang riil.
              </span>
            </div>

            <div className="flex items-center justify-between text-xs bg-muted/50 p-2.5 rounded-lg border">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Wallet className="h-3.5 w-3.5 text-blue-500" /> Saldo Anda:</span>
              <span className="font-extrabold">{formatIDR(balance)}</span>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nominal Investasi (IDR)
              </label>
              <input
                type="number"
                min={isRemainderOnly ? remainingAmountIdr : minInvestmentIdr}
                max={remainingAmountIdr}
                step={100_000}
                disabled={isRemainderOnly}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background font-semibold"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>Min: {formatIDR(minInvestmentIdr)}</span>
                <span>Sisa Kuota: {formatIDR(remainingAmountIdr)}</span>
              </div>
            </div>

            {isInsufficient && (
              <p className="text-xs text-rose-500 font-semibold">
                Saldo tidak mencukupi (Tersedia: {formatIDR(balance)}). Silakan top up saldo Anda.
              </p>
            )}

            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-muted-foreground"
              />
              <span>
                Saya memahami bahwa ini adalah <strong>simulasi edukatif</strong> dan menyetujui ketentuan sandbox UHUI.
              </span>
            </label>

            {investMutation.isError && (
              <p className="text-xs text-destructive">
                Gagal memproses investasi: {(investMutation.error as Error).message}
              </p>
            )}

            <button
              type="submit"
              disabled={!confirmed || isInsufficient || amount < (isRemainderOnly ? remainingAmountIdr : minInvestmentIdr) || amount > remainingAmountIdr || investMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {investMutation.isPending ? "Memproses..." : `Konfirmasi Investasi (${formatIDR(amount)})`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

