"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { FileSpreadsheet, AlertCircle } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useSMEProfile } from "@/hooks/use-documents";
import { useReportSnapshot, useUpdateVerifyShowFigures } from "@/hooks/use-reports";
import { ReportPicker, type DocType } from "@/components/domain/reports/ReportPicker";
import { ReportMeta } from "@/components/domain/reports/ReportMeta";
import { LoadingState } from "@/components/states/LoadingState";

const PdfPreview = dynamic(
  () => import("@/components/pdf/PdfPreview").then((m) => m.PdfPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8 text-xs sm:text-sm text-[#516072] dark:text-slate-400 stitch-card">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1D5FAE] border-t-transparent mr-2.5" />
        Menyiapkan dokumen PDF standar SAK EMKM ber-hash SHA-256...
      </div>
    ),
  }
);

export default function ReportsExportPage() {
  const { smeId } = useSession();
  const { profile } = useSMEProfile(smeId);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [docType, setDocType] = useState<DocType>("sak_emkm");
  const [period, setPeriod] = useState<string>(currentMonth);

  const { data: snapshot, isLoading, error } = useReportSnapshot(smeId, docType, period);
  const updateShowFigures = useUpdateVerifyShowFigures(smeId);

  const handleToggleFigures = async (val: boolean) => {
    await updateShowFigures.mutateAsync(val);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 border-b border-[#E2E7EB] dark:border-white/[0.08] pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DFE9F1] dark:bg-blue-950/60 text-[#1D5FAE] dark:text-blue-300">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
            Ekspor Laporan Keuangan SAK EMKM
          </h1>
          <p className="text-xs text-[#516072] dark:text-slate-400 mt-0.5">
            Dokumen akuntansi resmi ber-hash SHA-256 dan kode QR verifikasi publik siap audit bank.
          </p>
        </div>
      </div>

      <ReportPicker
        selectedType={docType}
        selectedPeriod={period}
        onTypeChange={setDocType}
        onPeriodChange={setPeriod}
      />

      {isLoading ? (
        <LoadingState message="Menghitung buku besar kanonik dan snapshot SAK EMKM..." />
      ) : error ? (
        <div className="p-4 bg-[#FFDAD6] border border-red-200 dark:border-red-900/40 text-[#BA1A1A] dark:text-red-300 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Gagal memuat snapshot laporan keuangan. Pastikan ada transaksi tercatat pada periode ini.</span>
        </div>
      ) : snapshot ? (
        <div className="space-y-6">
          <ReportMeta
            sha256={snapshot.sha256}
            showFigures={!!profile?.verify_show_figures}
            onToggleShowFigures={handleToggleFigures}
          />

          <PdfPreview
            docType={docType}
            businessName={profile?.business_name || "Usaha Saya"}
            sha256={snapshot.sha256}
            data={snapshot.payload as Record<string, unknown>}
          />
        </div>
      ) : null}
    </div>
  );
}
