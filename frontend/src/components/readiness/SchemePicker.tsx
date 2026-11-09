"use client";

import React from "react";

interface SchemePickerProps {
  currentScheme: string;
  onSchemeChange: (scheme: "revenue_sharing" | "micro_equity") => void;
}

export function SchemePicker({ currentScheme, onSchemeChange }: SchemePickerProps) {
  return (
    <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => onSchemeChange("revenue_sharing")}
        className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
          currentScheme === "revenue_sharing"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        Bagi Hasil (Revenue Sharing)
      </button>
      <button
        type="button"
        onClick={() => onSchemeChange("micro_equity")}
        className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
          currentScheme === "micro_equity"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        Bursa Mikro-Ekuitas (Saham PT)
      </button>
    </div>
  );
}

