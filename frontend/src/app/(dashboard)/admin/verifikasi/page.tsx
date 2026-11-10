"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { ReviewQueueTable } from "@/components/admin/ReviewQueueTable";

export default function AdminVerifikasiDokumenPage() {
  const { queue, isLoading, reviewDocument } = useAdmin();

  const handleReviewSubmit = async (
    id: string,
    status: "approved" | "rejected",
    reviewNote?: string
  ) => {
    await reviewDocument.mutateAsync({ id, status, reviewNote });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#1D5FAE] mb-1 transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Ringkasan Superadmin</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Kurasi Dokumen Legal (NIB, NPWP, Akta PT)
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verifikasi dokumen legal yang diajukan oleh pemilik UMKM untuk kelayakan bursa saham.
                </p>
              </div>
            </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-xs text-slate-400">
          Memuat antrean verifikasi kurator...
        </div>
      ) : (
        <ReviewQueueTable items={queue} onReviewSubmit={handleReviewSubmit} />
      )}
    </div>
  );
}

