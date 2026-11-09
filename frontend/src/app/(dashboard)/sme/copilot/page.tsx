"use client";

import Link from "next/link";
import { Settings, Sparkles, AlertCircle } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useLatestAIReport, useToggleActionItem } from "@/hooks/use-ai";
import { HealthScoreCard } from "@/components/domain/copilot/HealthScoreCard";
import { ActionItems } from "@/components/domain/copilot/ActionItems";
import { AnomalyList } from "@/components/domain/copilot/AnomalyList";
import { LoadingState } from "@/components/states/LoadingState";

export default function CopilotPage() {
  const { smeId } = useSession();
  const { data: report, isLoading, error } = useLatestAIReport(smeId);
  const toggleAction = useToggleActionItem(smeId);

  if (isLoading) {
    return <LoadingState message="Memuat diagnosa AI Co-Pilot keuangan terbaru..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E7EB] dark:border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DFE9F1] dark:bg-blue-950/60 text-[#1D5FAE] dark:text-blue-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
              AI Business Co-Pilot
            </h1>
          </div>
          <p className="text-xs text-[#516072] dark:text-slate-400 mt-1">
            Diagnosa kesehatan operasional, anomali kasir, dan rekomendasi margin laba SAK EMKM terkurasi.
          </p>
        </div>

        <Link
          href="/sme/copilot/pengaturan"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#132235] text-[#0F1E2E] dark:text-slate-200 border border-[#E2E7EB] dark:border-white/10 rounded-[11px] text-xs font-semibold shadow-xs hover:bg-[#F4F3F1] dark:hover:bg-white/5 transition"
        >
          <Settings className="w-4 h-4 text-[#516072]" />
          <span>Pengaturan Jadwal Analisis</span>
        </Link>
      </div>

      {error ? (
        <div className="p-4 bg-[#FFDAD6] border border-red-200 dark:border-red-900/40 text-[#BA1A1A] dark:text-red-300 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Gagal memuat laporan Co-Pilot. Silakan coba beberapa saat lagi.</span>
        </div>
      ) : !report ? (
        <div className="stitch-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#DFE9F1] dark:bg-blue-950/60 flex items-center justify-center mx-auto text-[#1D5FAE] dark:text-blue-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F1E2E] dark:text-white">
            Laporan Evaluasi Pertama Belum Tersedia
          </h3>
          <p className="text-xs text-[#516072] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Co-Pilot mengevaluasi buku kasir dan stok Anda secara berkala. Laporan pertama akan dihasilkan secara otomatis setelah transaksi aktif tercatat.
          </p>
          <div className="pt-2">
            <Link
              href="/sme/copilot/pengaturan"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D5FAE] hover:bg-[#184e91] text-white text-xs font-semibold rounded-[11px] shadow-xs transition"
            >
              Atur Frekuensi Analisis
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <HealthScoreCard
            score={report.health_score}
            periodDays={report.period_days}
            modelName={report.model_name}
          />

          <div className="stitch-card p-6 space-y-2">
            <h3 className="text-sm font-bold text-[#0F1E2E] dark:text-white">
              Ringkasan Eksekutif Keuangan &amp; Operasional
            </h3>
            <p className="text-xs text-[#516072] dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {report.summary_text}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0F1E2E] dark:text-white">
                Rekomendasi Aksi Praktis
              </h3>
              <ActionItems
                items={report.action_items || []}
                onToggle={(actionId, done) =>
                  toggleAction.mutate({ reportId: report.id, actionId, done })
                }
                isLoading={toggleAction.isPending}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0F1E2E] dark:text-white">
                Anomali Stok &amp; Kas Terdeteksi
              </h3>
              <AnomalyList anomalies={report.anomalies || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
