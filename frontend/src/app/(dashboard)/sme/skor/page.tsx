"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useReadiness } from "@/hooks/use-readiness";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { ComponentBars } from "@/components/charts/ComponentBars";
import { GateList } from "@/components/readiness/GateList";
import { SchemePicker } from "@/components/readiness/SchemePicker";
import { formatWIB } from "@/lib/dates";

export default function ReadinessScorePage() {
  const { smeId } = useSession();
  const [scheme, setScheme] = useState<"revenue_sharing" | "micro_equity">("revenue_sharing");
  const { score, latestSubmitted, isLoading, submitScore } = useReadiness(smeId, scheme);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmitSnapshot = async () => {
    try {
      await submitScore.mutateAsync(scheme);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch {

    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Skor Kesiapan Digital (Digital Readiness Score)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evaluasi otomatis pembukuan 30 hari untuk kelayakan pendanaan bagi hasil atau penawaran saham.
          </p>
        </div>

        <SchemePicker currentScheme={scheme} onSchemeChange={setScheme} />
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400">
          Menghitung simulasi skor kesiapan...
        </div>
      ) : !score ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
          Data pembukuan belum tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          { }
          <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
            <div className="w-full text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Skor Total
              </span>
              <div className="my-5">
                <ScoreRing score={score.total} size={160} strokeWidth={14} />
              </div>
              <div className="mt-2 text-xs">
                {score.gate_passed ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#1D5FAE] dark:text-blue-400">
                      <CheckCircle2 className="h-4 w-4" /> Memenuhi Semua Persyaratan
                    </span>
                    ) : (
                    <span className="font-semibold text-rose-500">
                      {(score.gate_failures ?? []).length} Gerbang Kelayakan Belum Terpenuhi
                    </span>
                )}
                  </div>
            </div>

              <div className="mt-6 w-full border-t border-slate-100 pt-4 dark:border-white/[0.06]">
                <button
                  type="button"
                  disabled={submitScore.isPending || !score.gate_passed}
                  onClick={handleSubmitSnapshot}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5FAE] hover:bg-[#184e91] py-3 text-xs font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitScore.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : submitSuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>
                    {submitSuccess ? "Snapshot Tersimpan!" : "Kirim Snapshot Kesiapan"}
                  </span>
                </button>
                {latestSubmitted && (
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Snapshot terakhir: {formatWIB(latestSubmitted.computed_at, "full")}
                  </p>
                )}
              </div>
            </div>

            { }
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rincian 4 Komponen Finansial
                </h3>
                <ComponentBars
                  componentA={score.component_a}
                  componentB={score.component_b}
                  componentC={score.component_c}
                  componentD={score.component_d}
                  scheme={scheme}
                />
              </div>

              <GateList gateFailures={score.gate_failures ?? []} />
            </div>
          </div>
      )}
        </div>
      );
}
