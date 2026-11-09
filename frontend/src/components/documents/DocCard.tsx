"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Clock, Download, FileText, Upload } from "lucide-react";

export interface SMEDocInfo {
  docType: "nib" | "ktp_owner" | "npwp" | "sk_kemenkumham" | string;
  title: string;
  description: string;
  isRequiredForBursa?: boolean;
  uploadedDoc?: {
    id: string;
    status: string;
    reviewNote?: string | null;
    downloadUrl?: string;
    createdAt: string;
  };
}

interface DocCardProps {
  info: SMEDocInfo;
  onUploadClick: (docType: string) => void;
}

export function DocCard({ info, onUploadClick }: DocCardProps) {
  const status = info.uploadedDoc?.status ?? "not_uploaded";

  const statusBadges: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    not_uploaded: {
      label: "Belum Diunggah",
      icon: <Clock className="h-3.5 w-3.5" />,
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    },
    pending: {
      label: "Menunggu Verifikasi",
      icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
      color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    },
    approved: {
      label: "Terverifikasi",
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />,
      color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    },
    rejected: {
      label: "Ditolak",
      icon: <AlertCircle className="h-3.5 w-3.5 text-rose-500" />,
      color: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    },
  };

  const badge = statusBadges[status] ?? statusBadges.not_uploaded;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-zinc-500" />
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{info.title}</h4>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${badge.color}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{info.description}</p>

        {info.uploadedDoc?.reviewNote && status === "rejected" && (
          <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="font-bold">Catatan Kurator: </span>
            {info.uploadedDoc.reviewNote}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {info.uploadedDoc?.downloadUrl ? (
          <a
            href={info.uploadedDoc.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Berkas</span>
          </a>
        ) : (
          <span className="text-xs text-zinc-400">-</span>
        )}

        <button
          type="button"
          onClick={() => onUploadClick(info.docType)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>{info.uploadedDoc ? "Unggah Ulang" : "Unggah Dokumen"}</span>
        </button>
      </div>
    </div>
  );
}

