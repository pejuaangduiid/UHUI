"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { getGateInfo } from "@/lib/gate-messages";

interface GateListProps {
  gateFailures: string[];
}

const ALL_GATES = [
  "NIB_BELUM_TERVERIFIKASI",
  "PT_TIDAK_SESUAI",
  "DOKUMEN_PT_BELUM_TERVERIFIKASI",
  "DATA_BELUM_CUKUP",
  "RIWAYAT_KURANG",
  "SKOR_DI_BAWAH_AMBANG",
];

export function GateList({ gateFailures }: GateListProps) {
  const failureSet = new Set(gateFailures);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        Gerbang Kelayakan (Gate Requirements)
      </h4>
      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {ALL_GATES.map((code) => {
          const isFailed = failureSet.has(code);
          const info = getGateInfo(code);

          return (
            <div
              key={code}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                {isFailed ? (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                )}
                <div>
                  <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {info.title}
                  </h5>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {info.description}
                  </p>
                </div>
              </div>

              {isFailed && (
                <Link
                  href={info.actionHref}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span>{info.actionText}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

