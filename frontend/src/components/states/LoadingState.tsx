import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Memuat data...",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 text-center text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-zinc-900 dark:text-zinc-100" />
      <p className="mt-3 text-sm font-medium">{message}</p>
      <span className="sr-only">Sedang memuat data</span>
    </div>
  );
}

