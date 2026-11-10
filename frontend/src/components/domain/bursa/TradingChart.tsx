"use client";

import React, { useState } from "react";
import { formatIDR } from "@/lib/money";
import { TrendingUp } from "lucide-react";

export interface TradingPoint {
  timestamp: string;
  price_idr: number;
  volume_idr?: number;
}

interface TradingChartProps {
  points?: TradingPoint[] | null;
  currentPrice: number;
  changeBps?: number;
  businessName?: string;
  className?: string;
}

const INTERVALS = ["1D", "1W", "1M", "1Y", "ALL"] as const;

export function TradingChart({
  points = [],
  currentPrice,
  changeBps = 600,
  businessName,
  className = "",
}: TradingChartProps) {
  const [activeInterval, setActiveInterval] = useState<(typeof INTERVALS)[number]>("1M");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chartData = (points && points.length > 1) ? points : [
    { timestamp: "10:00", price_idr: currentPrice * 0.94 },
    { timestamp: "12:00", price_idr: currentPrice * 0.96 },
    { timestamp: "14:00", price_idr: currentPrice * 0.93 },
    { timestamp: "16:00", price_idr: currentPrice * 0.98 },
    { timestamp: "18:00", price_idr: currentPrice * 0.95 },
    { timestamp: "20:00", price_idr: currentPrice * 1.02 },
    { timestamp: "22:00", price_idr: currentPrice },
  ];

  const activePoint = hoverIndex !== null ? chartData[hoverIndex] : chartData[chartData.length - 1];
  const prices = chartData.map((d) => d.price_idr);
  const min = Math.min(...prices) * 0.98;
  const max = Math.max(...prices) * 1.02;
  const range = max - min || 1;

  const width = 600;
  const height = 200;

  const coords = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * width;
    const y = height - ((d.price_idr - min) / range) * (height - 30) - 15;
    return { x, y, ...d };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {businessName ? `${businessName} • Valuasi Saham` : "Performa Valuasi Aset"}
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {formatIDR(activePoint.price_idr)}
            </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#DFE9F1] text-[#1D5FAE] border border-[#B9C8DD]">
                <TrendingUp className="h-3 w-3" /> +{(changeBps / 100).toFixed(2)}%
              </span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/5">
          {INTERVALS.map((intv) => (
            <button
              key={intv}
              type="button"
              onClick={() => setActiveInterval(intv)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeInterval === intv
                  ? "bg-[#1D5FAE] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
            >
              {intv}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-[200px] overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tradingWaveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D5FAE" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#1D5FAE" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#1D5FAE" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#tradingWaveGradient)" />
          <path d={linePath} fill="none" stroke="#1D5FAE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={hoverIndex === i ? 6 : 3}
              className={`transition-all cursor-pointer ${hoverIndex === i
                  ? "fill-white stroke-[#1D5FAE] stroke-[3px]"
                  : "fill-[#1D5FAE] opacity-60 hover:opacity-100"
                }`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}
        </svg>
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 border-t border-slate-100 dark:border-white/[0.05] pt-3">
        <span>Simulasi Pasar Sekunder Terbuka</span>
        <span>Terakhir Diperbarui: {new Date(activePoint.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

