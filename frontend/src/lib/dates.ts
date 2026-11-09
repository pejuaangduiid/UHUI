

export function formatWIB(date: string | Date | number, formatStyle: "short" | "full" = "short"): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: formatStyle === "full" ? "long" : "short",
    day: "numeric",
    ...(formatStyle === "full" ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function isWithin7Days(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const maxDiffMs = 7 * 24 * 60 * 60 * 1000;
  
  return diffMs <= maxDiffMs && diffMs >= -3600 * 1000;
}

export function minAllowedTxDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export function maxAllowedTxDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(date: string | Date | number, formatStyle: "short" | "full" = "short"): string {
  return formatWIB(date, formatStyle);
}

