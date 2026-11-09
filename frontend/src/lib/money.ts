

export function formatIDR(amount: number | bigint | string): string {
  const num = typeof amount === "bigint" ? Number(amount) : typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(num)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function parseIDR(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d-]/g, "");
  const parsed = parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function floorDivBig(numerator: bigint, denominator: bigint): bigint {
  if (denominator === BigInt(0)) {
    throw new Error("division by zero");
  }
  return numerator / denominator;
}

export function bpsFromPercent(percent: number): number {
  return Math.round(percent * 100);
}
