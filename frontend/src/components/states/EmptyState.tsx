import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Belum Ada Data",
  description = "Tidak ada informasi yang dapat ditampilkan saat ini.",
  action,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center p-8 text-center text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

