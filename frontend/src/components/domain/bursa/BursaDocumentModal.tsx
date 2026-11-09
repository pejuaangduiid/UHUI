"use client";

import React, { useState } from "react";
import { X, ShieldCheck, Download, Copy, Check, FileText } from "lucide-react";
import { formatIDR } from "@/lib/money";
import { usePublicVerification } from "@/hooks/use-reports";
import { downloadRealPdf } from "@/lib/pdf/download";

export interface BursaDocItem {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  hash: string;
  created_at: string;
  download_url?: string;
  verify_url?: string;
}

interface BursaDocumentModalProps {
  doc: BursaDocItem | null;
  businessName: string;
  sector: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export function BursaDocumentModal({
  doc,
  businessName,
  sector,
  isOpen,
  onClose,
  onDownload,
}: BursaDocumentModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cleanHash = doc?.hash.replace(/^sha256:/, "") ?? "";
  const { data: verifyData } = usePublicVerification(cleanHash);

  if (!isOpen || !doc) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (onDownload) return onDownload();
    try {
      setDownloading(true);
      await downloadRealPdf({
        title: doc.title, docType: doc.doc_type, sha256: doc.hash, businessName, sector,
        figures: verifyData?.figures ? { total_revenue_idr: verifyData.figures.total_revenue_idr, net_profit_idr: verifyData.figures.net_profit_idr } : undefined,
        downloadUrl: doc.download_url,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#121827] text-slate-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-base">{doc.title}</h3>
              <p className="text-xs text-slate-400">{businessName} • {sector}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0" />
          <span>Status Verifikasi: <strong>{doc.status}</strong> (Kriptografis Terjamin)</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-[#151c2e] p-3.5 rounded-2xl border border-slate-100 dark:border-white/[0.06]">
          <div><span className="text-slate-400 block text-[11px]">Jenis Dokumen</span><span className="font-semibold uppercase">{doc.doc_type}</span></div>
          <div><span className="text-slate-400 block text-[11px]">Diterbitkan Pada</span><span className="font-semibold">{new Date(doc.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}</span></div>
        </div>

        {verifyData?.figures && (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#151c2e] space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Ringkasan Kunci SAK EMKM Terverifikasi</span>
            <div className="flex justify-between"><span className="text-slate-400">Total Penjualan:</span><strong className="text-[#1D5FAE] dark:text-blue-400 font-mono">{formatIDR(verifyData.figures.total_revenue_idr)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Laba Bersih Kas:</span><strong className="text-[#1D5FAE] dark:text-blue-400 font-mono">{formatIDR(verifyData.figures.net_profit_idr)}</strong></div>
          </div>
        )}

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Bukti Kriptografis (SHA-256 Hash)</span>
            <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-400">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Tersalin" : "Salin Hash"}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all select-all">
            {doc.hash}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/[0.06] pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 transition">Tutup</button>
          <button type="button" disabled={downloading} onClick={handleDownload} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm disabled:opacity-50">
            <Download className="h-3.5 w-3.5" />
            <span>{downloading ? "Merender..." : "Unduh PDF Resmi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
