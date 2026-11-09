"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, FileCheck2, ShieldCheck, ArrowRight, Clock } from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { useReportSnapshot } from "@/hooks/use-reports";

interface RequiredDocumentsCardProps {
  smeId?: string;
}

export function RequiredDocumentsCard({ smeId }: RequiredDocumentsCardProps) {
  const { documents } = useDocuments(smeId);
  const { data: sakSnap } = useReportSnapshot(smeId, "sak_emkm");

  const nibDoc = documents.find((d) => d.doc_type === "nib");
  const npwpDoc = documents.find((d) => d.doc_type === "npwp");

  const isNibVerified = nibDoc?.status === "verified";
  const isNpwpVerified = npwpDoc?.status === "verified";
  const hasSak = Boolean(sakSnap);

  const isAllReady = isNibVerified && isNpwpVerified && hasSak;

  const renderDocBadge = (doc: typeof nibDoc) => {
    if (!doc) {
      return (
        <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Wajib Unggah
        </span>
      );
    }
    if (doc.status === "verified") {
      return (
        <span className="text-[10px] font-semibold text-blue-500 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Terverifikasi
        </span>
      );
    }
    if (doc.status === "rejected") {
      return (
        <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Ditolak Admin
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-1">
        <Clock className="h-3 w-3" /> Menunggu Verif
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Kurasi Dokumen Legal (NIB, NPWP, Akta PT) &amp; Kelayakan Bursa
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Dokumen wajib diverifikasi kurator admin sebelum pemilik usaha dapat menjual saham usahanya di bursa.
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${isAllReady
            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
            }`}
        >
          {isAllReady ? "Legalitas Terverifikasi Admin" : "Menunggu Verifikasi Admin"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#151c2e] flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Legalitas NIB</span>
              {renderDocBadge(nibDoc)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {!nibDoc ? "NIB belum diunggah" : nibDoc.status === "verified" ? "NIB telah disetujui kurator" : nibDoc.status === "rejected" ? `Ditolak: ${nibDoc.review_note || "Perlu revisi"}` : "Menunggu peninjauan kurator admin"}
            </p>
          </div>
          <Link
            href="/sme/dokumen"
            className="inline-flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 pt-1"
          >
            <span>{nibDoc ? "Kelola NIB" : "Unggah NIB"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#151c2e] flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Legalitas NPWP</span>
              {renderDocBadge(npwpDoc)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {!npwpDoc ? "NPWP belum diunggah" : npwpDoc.status === "verified" ? "NPWP telah disetujui kurator" : npwpDoc.status === "rejected" ? `Ditolak: ${npwpDoc.review_note || "Perlu revisi"}` : "Menunggu peninjauan kurator admin"}
            </p>
          </div>
          <Link
            href="/sme/dokumen"
            className="inline-flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 pt-1"
          >
            <span>{npwpDoc ? "Kelola NPWP" : "Unggah NPWP"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#151c2e] flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Laporan SAK EMKM</span>
              {hasSak ? (
                <span className="text-[10px] font-semibold text-blue-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-1">
                  <FileCheck2 className="h-3 w-3" /> Diperlukan
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {hasSak ? "Snapshot pembukuan siap di bursa" : "Ekspor pembukuan standar SAK EMKM"}
            </p>
          </div>
          <Link
            href="/sme/laporan"
            className="inline-flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 pt-1"
          >
            <span>{hasSak ? "Lihat SAK EMKM" : "Buka Laporan Keuangan"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
