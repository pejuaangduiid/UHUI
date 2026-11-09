import React from "react";
import { formatIDR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import type { components } from "@/types/api";

type ProfitDistribution = components["schemas"]["ProfitDistributionDTO"];

interface DistributionTableProps {
  distributions: ProfitDistribution[];
}

export function DistributionTable({ distributions }: DistributionTableProps) {
  if (distributions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs border rounded-lg bg-card">
        Belum ada riwayat pembagian dividen / bagi hasil untuk kampanye ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {distributions.map((d) => (
        <div key={d.id} className="border rounded-xl p-4 bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 mb-3">
            <div>
              <span className="text-xs text-muted-foreground block">Periode Laporan</span>
              <span className="text-sm font-semibold">
                {formatDate(d.period_start)} s/d {formatDate(d.period_end)}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-muted-foreground block">Total Pool Dibagikan</span>
              <span className="text-sm font-bold text-primary">{formatIDR(d.pool_idr)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2">Investor</th>
                  <th className="pb-2 text-right">Porsi Dividen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {d.items?.map((it) => (
                  <tr key={it.investment_id}>
                    <td className="py-2 font-medium">{it.investor_name || "Investor"}</td>
                    <td className="py-2 text-right font-semibold text-foreground">
                      {formatIDR(it.amount_idr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

