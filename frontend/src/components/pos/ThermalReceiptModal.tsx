"use client";

import React, { useState } from "react";
import { formatIDR } from "@/lib/money";
import { Printer, X, CheckCircle2 } from "lucide-react";

export interface ReceiptItem {
  name: string;
  qty: number;
  unitPriceIDR: number;
  subtotalIDR: number;
}

export interface ReceiptData {
  receiptNo: string;
  businessName: string;
  sector?: string;
  date: Date;
  items: ReceiptItem[];
  totalAmountIDR: number;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export function ThermalReceiptModal({ isOpen, onClose, receipt }: ThermalReceiptModalProps) {
  const [paperWidth, setPaperWidth] = useState<"58" | "80">("58");

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(receipt.date);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#121827]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06] mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Struk Transaksi Kasir</h3>
              <p className="text-[10px] text-slate-400">Format cetak printer thermal fisik</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mb-3 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs">
          <span className="text-[11px] font-semibold text-slate-500 px-2">Ukuran Kertas:</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => setPaperWidth("58")} className={`px-3 py-1 rounded-lg font-bold text-xs transition ${paperWidth === "58" ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs" : "text-slate-500"}`}>58 mm</button>
            <button type="button" onClick={() => setPaperWidth("80")} className={`px-3 py-1 rounded-lg font-bold text-xs transition ${paperWidth === "80" ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs" : "text-slate-500"}`}>80 mm</button>
          </div>
        </div>

        <div className="flex justify-center my-3">
          <div id="thermal-receipt" className={`border border-dashed border-zinc-400 bg-amber-50/40 p-4 font-mono text-zinc-900 shadow-inner dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-700 transition-all ${paperWidth === "58" ? "w-[270px] text-[11px]" : "w-[340px] text-xs"}`}>
            <div className="text-center space-y-0.5">
              <h4 className="font-extrabold uppercase tracking-wider text-sm">{receipt.businessName}</h4>
              {receipt.sector && <p className="text-[10px] text-zinc-500">{receipt.sector}</p>}
              <p className="text-[10px] text-zinc-400">Sistem POS SAK EMKM - UHUI</p>
            </div>
            <div className="border-t border-dashed border-zinc-400 my-2 pt-1 text-[10px] text-zinc-500 space-y-0.5">
              <div className="flex justify-between"><span>No:</span><span className="font-bold">{receipt.receiptNo}</span></div>
              <div className="flex justify-between"><span>Waktu:</span><span>{formattedDate}</span></div>
            </div>
            <div className="border-t border-dashed border-zinc-400 my-2 pt-2 space-y-1.5">
              {receipt.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold truncate">{it.name}</div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-[10px]">
                    <span>{it.qty} x {formatIDR(it.unitPriceIDR)}</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatIDR(it.subtotalIDR)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-zinc-400 my-2 pt-2 space-y-1">
              <div className="flex justify-between font-extrabold text-sm"><span>TOTAL:</span><span>{formatIDR(receipt.totalAmountIDR)}</span></div>
              <div className="flex justify-between text-[10px] text-zinc-500"><span>Metode Bayar:</span><span className="font-bold uppercase">TUNAI / KAS</span></div>
            </div>
            <div className="border-t border-dashed border-zinc-400 my-2 pt-2 text-center text-[10px] text-zinc-400">
              <p className="font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Tutup</button>
          <button type="button" onClick={handlePrint} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1D5FAE] hover:bg-[#184e91] text-xs font-bold text-white shadow-md shadow-blue-500/20 transition">
            <Printer className="h-4 w-4" />
            <span>Cetak Struk Fisik</span>
          </button>
        </div>
      </div>
    </div>
  );
}