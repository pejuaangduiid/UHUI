"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, AlertTriangle, RefreshCw } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useReceiptScan } from "@/hooks/use-receipt-scan";
import { useScanStore } from "@/stores/scan-store";
import { CameraInput } from "@/components/receipts/CameraInput";

export default function ReceiptUploadPage() {
  const router = useRouter();
  const { smeId } = useSession();
  const { scanReceipt } = useReceiptScan(smeId);
  const setCurrentScan = useScanStore((s) => s.setCurrentScan);
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const handleImageSelected = async (base64: string, dataUrl: string, filename: string) => {
    setError(null);
    setIsDuplicate(false);
    try {
      const res = await scanReceipt.mutateAsync({ imageBase64: base64, filename });
      if (!res) throw new Error("Gagal memproses nota");

      setCurrentScan({
        scanId: res.scan_id,
        merchantName: res.merchant_name,
        date: res.date,
        totalAmountIDR: res.total_amount_idr,
        items: (res.items ?? []).map((i) => ({
          description: i.description,
          qty: i.qty,
          unitPriceIDR: i.unit_price_idr,
          lineTotalIDR: i.line_total_idr,
        })),
        duplicateSuspect: res.duplicate_suspect,
        imageDataUrl: dataUrl,
      });

      router.push(`/sme/nota/${res.scan_id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memindai nota";
      const dup =
        msg.toLowerCase().includes("duplikat") ||
        msg.toLowerCase().includes("pernah digunakan") ||
        msg.includes("DUPLICATE_PROOF");
      setIsDuplicate(dup);
      setError(msg);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Receipt className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Pindai Bukti Nota / Kwitansi Fisik
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          AI OCR akan mengekstrak data toko, tanggal, item pembelian, dan otomatis mencatat ke inventaris UMKM.
        </p>
      </div>

      {isDuplicate && (
        <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-5 shadow-sm dark:border-amber-600 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                Peringatan: Kwitansi / Bukti Nota Duplikat!
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Foto bukti kwitansi ini telah pernah dipindai dan tercatat sebelumnya dalam sistem. Untuk mencegah pencatatan berganda (anti double-counting R1.3), mohon gunakan foto nota transaksi yang berbeda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsDuplicate(false);
                }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Coba Nota Lain
              </button>
            </div>
          </div>
        </div>
      )}

      {error && !isDuplicate && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-semibold text-rose-500">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
        <CameraInput onImageSelected={handleImageSelected} isLoading={scanReceipt.isPending} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4.5 text-xs text-slate-500 dark:border-white/[0.06] dark:bg-[#151c2e] dark:text-slate-400">
        <span className="font-bold text-slate-800 dark:text-slate-200">Catatan Batasan &amp; Otomasi:</span>
        <ul className="mt-1.5 list-disc pl-4 space-y-1">
          <li>Item belanja pada nota akan otomatis masuk dan menambah stok di menu Inventaris.</li>
          <li>Sistem mendeteksi indikasi nota duplikat guna melindungi kredibilitas pembukuan usaha.</li>
          <li>Maksimal 10 kali pemindaian nota per jam untuk setiap pengguna (R1.9).</li>
        </ul>
      </div>
    </div>
  );
}
