import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  hint?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Terjadi Kendala",
  message = "Gagal memuat informasi dari server.",
  hint,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        {message}
      </p>
      {hint && (
        <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-500">
          {hint}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}

