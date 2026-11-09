"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface ComponentBarsProps {
  componentA: number;
  componentB: number | null;
  componentC: number;
  componentD: number;
  scheme?: "revenue_sharing" | "micro_equity" | string;
}

export function ComponentBars({
  componentA,
  componentB,
  componentC,
  componentD,
  scheme = "revenue_sharing",
}: ComponentBarsProps) {
  const isRS = scheme !== "micro_equity";
  const items = [
    {
      name: "Komponen A (Arus Kas Bersih)",
      weight: isRS ? "40%" : "30%",
      score: componentA,
      isNull: false,
    },
    {
      name: "Komponen B (Frekuensi Restok)",
      weight: isRS ? "25%" : "20%",
      score: componentB,
      isNull: componentB === null,
    },
    {
      name: "Komponen C (Rasio Nota Terverifikasi)",
      weight: isRS ? "20%" : "25%",
      score: componentC,
      isNull: false,
    },
    {
      name: "Komponen D (Legalitas & Profil)",
      weight: isRS ? "15%" : "25%",
      score: componentD,
      isNull: false,
    },
  ];

  return (
    <div className="space-y-4">
      {items.map((it, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-zinc-700 dark:text-zinc-300">
              {it.name}{" "}
              <span className="text-zinc-400 dark:text-zinc-500">({it.weight})</span>
            </span>
            {it.isNull ? (
              <span
                data-testid="component-b-null"
                className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
              >
                <AlertCircle className="h-3 w-3" />
                Data belum cukup
              </span>
            ) : (
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {it.score} / 100
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${it.isNull
                ? "bg-amber-400 dark:bg-amber-500"
                : (it.score ?? 0) >= 70
                  ? "bg-[#1D5FAE] dark:bg-blue-500"
                  : "bg-sky-500 dark:bg-sky-400"
                }`}
              style={{ width: `${it.isNull ? 0 : it.score ?? 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}