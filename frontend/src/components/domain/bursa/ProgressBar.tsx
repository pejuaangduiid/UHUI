import React from "react";
import { formatIDR } from "@/lib/money";

interface ProgressBarProps {
  raisedAmountIdr: number;
  targetAmountIdr: number;
  className?: string;
}

export function ProgressBar({
  raisedAmountIdr,
  targetAmountIdr,
  className = "",
}: ProgressBarProps) {
  const percent =
    targetAmountIdr > 0
      ? Math.min(Math.round((raisedAmountIdr / targetAmountIdr) * 100), 100)
      : 0;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>Terkumpul: <strong className="text-slate-900 dark:text-white">{formatIDR(raisedAmountIdr)}</strong></span>
        <span className="font-bold text-blue-500">{`${percent}%`}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
        <div
          className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div >
  );
}
