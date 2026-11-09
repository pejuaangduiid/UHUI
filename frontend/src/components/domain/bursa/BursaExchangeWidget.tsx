"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { formatIDR } from "@/lib/money";
import { parseProblem } from "@/lib/api/errors";
import { useInvest } from "@/hooks/use-invest";
import { useSellShares } from "@/hooks/use-bursa-trading";
import { useSession } from "@/hooks/use-session";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BursaExchangeInputs } from "./BursaExchangeInputs";
import { BursaBoardroomCard } from "./BursaBoardroomCard";

interface BursaExchangeWidgetProps {
  campaignId: string;
  currentPrice: number;
  hasAccess?: boolean;
  investmentAmount?: number;
  remainingAmount?: number;
  onOpenBoardroom: () => void;
}

export function BursaExchangeWidget({
  campaignId, currentPrice, hasAccess, investmentAmount = 0, remainingAmount = 0, onOpenBoardroom,
}: BursaExchangeWidgetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();
  const unitPrice = currentPrice || 1000;
  const maxBuyShares = remainingAmount > 0 ? Math.floor(remainingAmount / unitPrice) : 0;
  const sharesOwned = Math.floor(investmentAmount / unitPrice);
  const defaultShares = maxBuyShares > 0 ? Math.min(10, maxBuyShares) : 10;
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState<number>(defaultShares);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const investMutation = useInvest();
  const sellMutation = useSellShares();
  const totalValue = shares * unitPrice;

  const handleExecute = () => {
    if (!user || !isAuthenticated) {
      toast.error("Kamu harus login dulu untuk transaksi saham.");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (shares <= 0) return;
    setStatusMsg(null);
    setErrorMsg(null);
    if (mode === "buy") {
      if (remainingAmount > 0 && totalValue > remainingAmount) {
        setErrorMsg(`Nominal (${formatIDR(totalValue)}) melebihi sisa kuota (${formatIDR(remainingAmount)}).`);
        return;
      }
      investMutation.mutate({ campaignId, amountIdr: totalValue }, {
        onSuccess: () => {
          setStatusMsg("Pembelian saham berhasil! Akses Ruang Rapat Pemegang Saham terbuka.");
          toast.success("Pembelian saham berhasil!");
        },
        onError: (err) => {
          const msg = parseProblem(err).message;
          setErrorMsg(msg);
          toast.error(msg);
        },
      });
    } else {
      if (sharesOwned <= 0 || totalValue > investmentAmount) {
        setErrorMsg("Saldo kepemilikan saham Anda tidak mencukupi untuk order jual ini.");
        return;
      }
      sellMutation.mutate({ campaignId, amountIdr: totalValue }, {
        onSuccess: (r) => {
          const msg = r?.message || "Order jual berhasil dicairkan ke saldo virtual.";
          setStatusMsg(msg);
          toast.success(msg);
          setShares(sharesOwned - shares > 0 ? sharesOwned - shares : 1);
        },
        onError: (err) => {
          const msg = parseProblem(err).message;
          setErrorMsg(msg);
          toast.error(msg);
        },
      });
    }
  };

  const isExecuting = investMutation.isPending || sellMutation.isPending;
  const isSellDisabled = mode === "sell" && sharesOwned === 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#131926]/90 backdrop-blur-md space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Portofolio</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{formatIDR(investmentAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Saham Dimiliki</div>
            <div className="text-sm font-bold text-blue-500 mt-0.5">{sharesOwned.toLocaleString("id-ID")} Lot/Lembar</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">Beli &amp; Jual Saham</span>
          <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
            <button type="button" onClick={() => setMode("buy")} className={`px-3 py-1 rounded-lg font-bold transition ${mode === "buy" ? "bg-[#1D5FAE] text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>Beli Saham</button>
            <button type="button" onClick={() => { setMode("sell"); if (sharesOwned > 0) setShares(sharesOwned); }} className={`px-3 py-1 rounded-lg font-bold transition ${mode === "sell" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>Jual Saham</button>
          </div>
        </div>

        <BursaExchangeInputs
          mode={mode}
          shares={shares}
          unitPrice={unitPrice}
          sharesOwned={sharesOwned}
          maxBuyShares={maxBuyShares}
          remainingAmount={remainingAmount}
          investmentAmount={investmentAmount}
          onSharesChange={(n) => setShares(n)}
        />

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {statusMsg && (
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleExecute}
          disabled={isExecuting || isSellDisabled}
          className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition flex items-center justify-center gap-2 ${isSellDisabled ? "bg-slate-700 opacity-50 cursor-not-allowed" : mode === "buy" ? "bg-[#1D5FAE] hover:bg-[#184e91] shadow-blue-500/20" : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-500/20"
            }`}
        >
          {isExecuting ? "Memproses..." : isSellDisabled ? "Tidak Memiliki Saham" : mode === "buy" ? "Beli Saham Usaha Ini" : shares >= sharesOwned && sharesOwned > 0 ? "Jual Semua Saham" : `Jual Saham (${shares} Lembar)`}
        </button>
      </div>
      <BursaBoardroomCard hasAccess={hasAccess} onOpenBoardroom={onOpenBoardroom} />
    </div>
  );
}
