"use client";

import React, { useState } from "react";
import { FileSpreadsheet, FileCheck2, ShieldCheck, Download, AlertCircle, Eye } from "lucide-react";
import { useBursaDocuments } from "@/hooks/use-bursa-trading";
import { downloadRealPdf } from "@/lib/pdf/download";
import { BursaDocumentModal, type BursaDocItem } from "./BursaDocumentModal";

interface BursaDocumentTabProps {
  campaignSlug: string;
  businessName: string;
  isPt: boolean;
  sector: string;
}

export function BursaDocumentTab({ campaignSlug, businessName, isPt, sector }: BursaDocumentTabProps) {
  const { data: docs, isLoading, error } = useBursaDocuments(campaignSlug);
  const [selectedDoc, setSelectedDoc] = useState<BursaDocItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (doc: BursaDocItem) => {
    try {
      setDownloadingId(doc.id);
      await downloadRealPdf({
        title: doc.title,
        docType: doc.doc_type,
        sha256: doc.hash,
        businessName,
        sector,
        isPt,
        downloadUrl: doc.download_url,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Dokumen Kepatuhan &amp; Transparansi Keuangan
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Data pembukuan SAK EMKM dan legalitas {businessName} ({sector}{isPt ? " • PT" : ""}) diverifikasi kriptografis on-chain dan anti-tamper.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Gagal memuat dokumen keuangan dari server.</span>
        </div>
      ) : !docs || docs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
          Belum ada dokumen publik yang diterbitkan.
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const Icon = doc.doc_type === "sak_emkm"
              ? FileSpreadsheet
              : doc.doc_type === "prospectus"
                ? FileCheck2
                : ShieldCheck;

            return (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{doc.title}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 break-all">{doc.hash}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Diterbitkan: {new Date(doc.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Lihat</span>
                  </button>
                  <button
                    type="button"
                    disabled={downloadingId === doc.id}
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{downloadingId === doc.id ? "Merender..." : "Unduh PDF"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BursaDocumentModal
        doc={selectedDoc}
        businessName={businessName}
        sector={sector}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        onDownload={() => {
          if (selectedDoc) {
            handleDownload(selectedDoc);
          }
        }}
      />
    </div>
  );
}