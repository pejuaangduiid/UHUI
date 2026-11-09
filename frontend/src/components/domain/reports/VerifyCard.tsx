import React from "react";
import { CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatIDR } from "@/lib/money";

export interface VerifyCardData {
  status: string;
  doc_type: string;
  business_name: string;
  sector: string;
  period_start: string;
  period_end: string;
  sha256: string;
  created_at: string;
  figures?: {
    total_revenue_idr: number;
    net_profit_idr: number;
    tx_count?: number;
  } | null;
}

export const VerifyCard: React.FC<{ data: VerifyCardData }> = ({ data }) => {
  return (
    <div className="max-w-lg w-full p-8 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-100">Dokumen Resmi Terverifikasi</h1>
          <p className="text-xs text-zinc-400">Integritas dokumen terjamin secara kriptografis</p>
        </div>
      </div>

      <div className="space-y-2 border-y border-zinc-800 py-4 text-xs">
        <div className="flex justify-between py-1"><span className="text-zinc-500">Nama Usaha:</span><strong className="text-zinc-200">{data.business_name}</strong></div>
        <div className="flex justify-between py-1"><span className="text-zinc-500">Sektor:</span><span className="text-zinc-300">{data.sector}</span></div>
        <div className="flex justify-between py-1"><span className="text-zinc-500">Jenis Dokumen:</span><span className="text-zinc-300 font-mono uppercase">{data.doc_type}</span></div>
        <div className="flex justify-between py-1"><span className="text-zinc-500">Periode Laporan:</span><span className="text-zinc-300">{data.period_start} s/d {data.period_end}</span></div>
      </div>

      {data.figures ? (
        <div data-testid="verified-figures" className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-zinc-400 block mb-1">Angka Kunci Terverifikasi (Dikonfirmasi Pemilik)</span>
          <div className="flex justify-between text-xs py-1"><span className="text-zinc-500">Total Penjualan:</span><strong className="text-blue-400 font-mono">{formatIDR(data.figures.total_revenue_idr)}</strong></div>
          <div className="flex justify-between text-xs py-1"><span className="text-zinc-500">Laba Bersih Kas:</span><strong className="text-blue-400 font-mono">{formatIDR(data.figures.net_profit_idr)}</strong></div>
          {data.figures.tx_count !== undefined && (
            <div className="flex justify-between text-xs py-1"><span className="text-zinc-500">Jumlah Transaksi:</span><span className="text-zinc-300 font-mono">{`${data.figures.tx_count} transaksi`}</span></div>
          )}
        </div>
      ) : null}

      <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg flex items-start gap-2.5 text-[11px] text-zinc-400">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>Panduan: Bandingkan angka pada berkas fisik/PDF Anda dengan data verifikasi resmi di atas.</span>
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Platform UHUI</span>
        <span className="font-mono">{data.sha256.slice(0, 16)}...</span>
      </div>
    </div>
  );
};
