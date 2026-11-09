import React from "react";

interface SimulationBadgeProps {
  className?: string;
}

export function SimulationBadge({ className = "" }: SimulationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 ${className}`}
    >
      SIMULASI
    </span>
  );
}

