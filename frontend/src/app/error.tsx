"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/states/ErrorState";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    
    console.error("UI error captured:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <ErrorState
        title="Terjadi Kesalahan Sistem"
        message="Aplikasi mengalami kendala saat memproses permintaan Anda."
        hint="Silakan coba muat ulang atau hubungi tim bantuan jika kendala berlanjut."
        onRetry={reset}
      />
    </div>
  );
}

