import React from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/money";
import { truncateHash } from "@/lib/pdf/hash";

export interface CashPoint {
  date: string;
  cashIDR: number;
}

interface CashChartProps {
  data: CashPoint[];
  snapshotSha256?: string;
}

export const CashChart: React.FC<CashChartProps> = ({ data, snapshotSha256 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
        Belum ada riwayat saldo kas untuk ditampilkan.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.cashIDR), 1);
  const minVal = Math.min(...data.map((d) => d.cashIDR), 0);
  const range = maxVal - minVal || 1;

  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-200">Deret Arus Kas Harian</h4>
        {snapshotSha256 && (
          <Link
            href={`/verify/${snapshotSha256}`}
            target="_blank"
            className="text-xs text-blue-400 hover:underline font-mono"
          >
            Hash: {truncateHash(snapshotSha256)}
          </Link>
        )}
      </div>

      <div className="h-36 flex items-end gap-1.5 pt-4 pb-2 border-b border-zinc-800" aria-hidden="true">
        {data.map((pt, i) => {
          const heightPct = Math.max(8, Math.round(((pt.cashIDR - minVal) / range) * 100));
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t transition-all ${pt.cashIDR >= 0 ? "bg-blue-500/70 group-hover:bg-blue-400" : "bg-rose-500/70 group-hover:bg-rose-400"
                  }`}
              />
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-800 text-[10px] text-zinc-200 px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                {pt.date}: {formatIDR(pt.cashIDR)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sr-only">
        <table aria-label="Tabel Arus Kas Harian">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Saldo Kas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pt, i) => (
              <tr key={i}>
                <td>{pt.date}</td>
                <td>{formatIDR(pt.cashIDR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

