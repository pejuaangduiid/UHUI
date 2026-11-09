"use client";

import React, { useState } from "react";
import { formatIDR } from "@/lib/money";
import type { CreateCampaignInput } from "@/hooks/use-campaigns";

interface CampaignFormProps {
  isPT: boolean;
  onSubmit: (data: CreateCampaignInput) => void;
  isLoading: boolean;
}

export function CampaignForm({ isPT, onSubmit, isLoading }: CampaignFormProps) {
  const [title, setTitle] = useState("");
  const [scheme, setScheme] = useState<"revenue_sharing" | "micro_equity">("revenue_sharing");
  const [targetAmount, setTargetAmount] = useState(25_000_000);
  const [minInvestment, setMinInvestment] = useState(500_000);
  const [returnPercent, setReturnPercent] = useState(15);
  const [termMonths, setTermMonths] = useState(12);
  const [closesAt, setClosesAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      scheme,
      target_amount_idr: targetAmount,
      min_investment_idr: minInvestment,
      return_share_bps: Math.round(returnPercent * 100),
      term_months: termMonths,
      closes_at: new Date(closesAt).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div>
        <label className="font-medium text-xs block mb-1">Judul Penawaran Saham Usaha</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="cth. Penjualan 15% Saham untuk Ekspansi Cabang Baru"
          className="w-full px-3 py-2 border rounded-lg bg-background"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium text-xs block mb-1">Skema Pendanaan</label>
          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value as "revenue_sharing" | "micro_equity")}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            <option value="revenue_sharing">Bagi Hasil</option>
            <option value="micro_equity" disabled={!isPT}>
              Mikro-Ekuitas {!isPT ? "(Khusus PT)" : ""}
            </option>
          </select>
        </div>
        <div>
          <label className="font-medium text-xs block mb-1">Tenor (Bulan)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={termMonths}
            onChange={(e) => setTermMonths(parseInt(e.target.value, 10) || 12)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium text-xs block mb-1">
            Target: <span className="text-primary font-bold">{formatIDR(targetAmount)}</span>
          </label>
          <input
            type="number"
            min={1_000_000}
            max={10_000_000_000}
            step={1_000_000}
            value={targetAmount}
            onChange={(e) => setTargetAmount(parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          />
        </div>
        <div>
          <label className="font-medium text-xs block mb-1">
            Min. Investasi: <span className="text-primary font-bold">{formatIDR(minInvestment)}</span>
          </label>
          <input
            type="number"
            min={50_000}
            max={targetAmount}
            step={50_000}
            value={minInvestment}
            onChange={(e) => setMinInvestment(parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium text-xs block mb-1">Persentase Bagi Hasil (%)</label>
          <input
            type="number"
            min={0.01}
            max={50}
            step={0.1}
            value={returnPercent}
            onChange={(e) => setReturnPercent(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          />
        </div>
        <div>
          <label className="font-medium text-xs block mb-1">Batas Penutupan</label>
          <input
            type="date"
            required
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !title}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
      >
        {isLoading ? "Menyimpan..." : "Simpan & Daftarkan Penjualan Saham"}
      </button>
    </form>
  );
}
