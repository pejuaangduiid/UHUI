"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function ScanNotFound() {
  const router = useRouter();
  return (
    <div className="flex h-64 flex-col items-center justify-center space-y-3">
      <p className="text-sm text-zinc-500">Data pindai tidak ditemukan atau sesi telah berakhir.</p>
      <button
        type="button"
        onClick={() => router.push("/sme/nota")}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Pindai Ulang Nota
      </button>
    </div>
  );
}

