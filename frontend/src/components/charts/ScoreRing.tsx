"use client";

import React from "react";

interface ScoreRingProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreRing({
  score,
  size = 140,
  strokeWidth = 12,
  label = "Skor Kesiapan",
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validScore = score !== null && Number.isFinite(score) ? Math.min(Math.max(score, 0), 100) : null;
  const strokeDashoffset = validScore !== null ? circumference - (validScore / 100) * circumference : circumference;

  const colorClass =
    validScore === null
      ? "text-zinc-300 dark:text-zinc-700"
      : validScore >= 80
        ? "text-[#1D5FAE] dark:text-blue-400"
        : validScore >= 60
          ? "text-amber-500 dark:text-amber-400"
          : "text-rose-500 dark:text-rose-400";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-100 dark:text-zinc-800"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={`transition-all duration-500 ease-out ${colorClass}`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {validScore !== null ? (
            <>
              <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                {validScore}
              </span>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">/ 100</span>
            </>
          ) : (
            <span className="px-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500" data-testid="score-null">
              Data Belum Cukup
            </span>
          )}
        </div>
      </div>
      {label && <span className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>}
    </div>
  );
}

