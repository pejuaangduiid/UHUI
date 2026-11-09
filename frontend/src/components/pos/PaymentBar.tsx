"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, Banknote } from "lucide-react";
import { formatIDR } from "@/lib/money";
import { usePosCartStore } from "@/stores/pos-cart-store";

export interface CompletedReceiptItem {
  name: string;
  qty: number;
  unitPriceIDR: number;
  subtotalIDR: number;
}

interface PaymentBarProps {
  onCheckout: (
    items: { inventory_item_id: string; qty: number; unit_price_idr: number }[],
    totalAmountIDR: number,
    receiptItems: CompletedReceiptItem[]
  ) => Promise<void>;
}

export function PaymentBar({ onCheckout }: PaymentBarProps) {
  const { items, getTotalAmount, clearCart } = usePosCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cashGiven, setCashGiven] = useState<number | null>(null);

  const total = getTotalAmount();
  const change = cashGiven !== null && cashGiven >= total ? cashGiven - total : 0;

  const quickNominals = [
    { label: "Uang Pas", val: total },
    { label: "50rb", val: 50000 },
    { label: "100rb", val: 100000 },
    { label: "200rb", val: 200000 },
  ];

  const handlePay = async () => {
    if (items.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = items.map((i) => ({
        inventory_item_id: i.itemId,
        qty: i.qty,
        unit_price_idr: i.sellingPriceIDR,
      }));
      const receiptItems: CompletedReceiptItem[] = items.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPriceIDR: i.sellingPriceIDR,
        subtotalIDR: i.qty * i.sellingPriceIDR,
      }));
      await onCheckout(payload, total, receiptItems);
      setSuccess(true);
      clearCart();
      setCashGiven(null);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#E2E7EB] bg-[#FAF9F6] p-4 dark:border-white/[0.08] dark:bg-[#101E2E]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#516072] dark:text-slate-400">Total Pembayaran</span>
        <span className="text-lg font-bold text-[#0F1E2E] dark:text-white tabular-nums">
          {formatIDR(total)}
        </span>
      </div>

      {/* Quick Cash Buttons for Kasir Ergonomics */}
      {items.length > 0 && total > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-[#516072] dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Banknote className="h-3 w-3 text-[#1D5FAE]" />
              <span>Hitung Cepat Uang Diterima:</span>
            </span>
            {cashGiven !== null && cashGiven >= total && (
              <span className="font-bold text-[#1D5FAE] dark:text-blue-300">
                Kembali: {formatIDR(change)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {quickNominals.map((nom) => (
              <button
                key={nom.label}
                type="button"
                onClick={() => setCashGiven(nom.val)}
                className={`py-1 px-1.5 rounded-lg text-[11px] font-semibold border transition text-center ${cashGiven === nom.val
                  ? "bg-[#1D5FAE] text-white border-[#1D5FAE]"
                  : "bg-white dark:bg-[#172940] border-[#E2E7EB] dark:border-white/10 text-[#0F1E2E] dark:text-slate-200 hover:border-[#1D5FAE]"
                  }`}
              >
                {nom.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={items.length === 0 || isSubmitting}
        onClick={handlePay}
        data-testid="pos-checkout-button"
        className="flex w-full items-center justify-center gap-2 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Menyimpan ke Buku Kas SAK EMKM...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-blue-200" />
            <span>Transaksi Berhasil Disimpan!</span>
          </>
        ) : (
          <span>Selesaikan Transaksi &amp; Catat Kas</span>
        )}
      </button>
    </div>
  );
}
