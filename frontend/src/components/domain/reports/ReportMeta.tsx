"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";

interface ReportMetaProps {
  sha256: string;
  showFigures: boolean;
  onToggleShowFigures: (val: boolean) => Promise<void>;
}

export const ReportMeta: React.FC<ReportMetaProps> = ({
  sha256,
  showFigures,
  onToggleShowFigures,
}) => {
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdating(true);
    try {
      await onToggleShowFigures(e.target.checked);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <ShieldCheck className="w-4 h-4 text-[#1D5FAE]" />
          <span>Kriptografis SHA-256 Snapshot</span>
        </div>
        <Link
          href={`/verify/${sha256}`}
          target="_blank"
          className="text-xs text-[#1D5FAE] hover:underline inline-flex items-center gap-1"
        >
          <span>Halaman Verifikasi Publik</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
        <code className="text-xs text-zinc-400 font-mono flex-1 break-all select-all">
          {sha256}
        </code>
        <button
          type="button"
          onClick={copyHash}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 rounded transition shrink-0"
          title="Salin Hash"
        >
          {copied ? <Check className="w-4 h-4 text-[#1D5FAE]" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-zinc-800/80">
        <input
          type="checkbox"
          checked={showFigures}
          disabled={updating}
          onChange={handleToggle}
          className="mt-0.5 rounded text-[#1D5FAE] focus:ring-[#1D5FAE]"
        />
        <div className="text-xs text-zinc-400">
          <strong className="text-zinc-200 block">Tampilkan Angka Kunci di Halaman Verifikasi Publik</strong>
          Jika diaktifkan, pihak luar yang memindai QR code dapat memverifikasi total penjualan dan laba di layar peramban.
        </div>
      </label>
    </div>
  );
};

