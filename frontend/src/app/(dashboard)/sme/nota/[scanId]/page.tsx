"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { useInventory } from "@/hooks/use-inventory";
import { useReceiptScan } from "@/hooks/use-receipt-scan";
import { useScanStore } from "@/stores/scan-store";
import { ProposalTable } from "@/components/receipts/ProposalTable";
import { VerificationNotice } from "@/components/receipts/VerificationNotice";
import { ScanNotFound } from "@/components/receipts/ScanNotFound";
import { formatIDR, parseIDR } from "@/lib/money";

export default function ReceiptConfirmPage() {
  const router = useRouter();
  const { smeId } = useSession();
  const { items: inventoryItems } = useInventory(smeId);
  const { confirmReceipt } = useReceiptScan(smeId);
  const { currentScan, updateItemMapping } = useScanStore();

  const [txType, setTxType] = useState<"sale" | "expense" | "restock">("restock");
  const [description, setDescription] = useState(currentScan ? `Restok dari ${currentScan.merchantName}` : "Restok Barang");
  const [customTotal, setCustomTotal] = useState(currentScan ? String(currentScan.totalAmountIDR) : "0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentScan || !inventoryItems || inventoryItems.length === 0) return;
    currentScan.items.forEach((item, idx) => {
      if (!item.matchedInventoryItemId) {
        const itemLower = item.description.toLowerCase().trim();
        const match = inventoryItems.find((inv) => inv.name.toLowerCase().includes(itemLower) || itemLower.includes(inv.name.toLowerCase()));
        if (match) updateItemMapping(idx, match.id);
      }
    });
  }, [currentScan, inventoryItems, updateItemMapping]);

  if (!currentScan) return <ScanNotFound />;

  const enteredTotal = parseIDR(customTotal);
  const isTotalMatched = enteredTotal === currentScan.totalAmountIDR;
  const isVerified = isTotalMatched && !currentScan.duplicateSuspect;

  const handleConfirm = async () => {
    setError(null);
    try {
      const mappedItems = currentScan.items.map((i) => ({
        inventory_item_id: i.matchedInventoryItemId || "",
        description: i.description,
        qty: i.qty,
        unit_price_idr: i.unitPriceIDR,
        auto_create: true,
      }));

      await confirmReceipt.mutateAsync({
        scan_id: currentScan.scanId,
        tx_type: txType,
        total_amount_idr: enteredTotal,
        description: description.trim() || `Nota ${currentScan.merchantName}`,
        items: mappedItems,
      });

      toast.success("Nota berhasil dicatat! Seluruh item otomatis masuk ke inventaris.");
      router.push("/sme/inventaris");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan konfirmasi");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/sme/nota")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Verifikasi Hasil Pindai Nota
          </h1>
          <p className="text-xs text-zinc-500">Item akan otomatis tersinkronisasi ke stok inventaris Anda.</p>
        </div>
      </div>

      <VerificationNotice isVerified={isVerified} isSuspectDuplicate={currentScan.duplicateSuspect} />
      {error && <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 dark:bg-red-950/40">{error}</div>}

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-zinc-500">Jenis Transaksi</label>
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value as "sale" | "expense" | "restock")}
              className="mt-1 w-full rounded-lg border border-zinc-200 p-2.5 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="restock">Restok Barang Dagangan</option>
              <option value="expense">Beban / Biaya Operasional</option>
              <option value="sale">Penjualan</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500">Keterangan Transaksi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500">Total Nominal (Rp)</label>
          <input
            type="text"
            value={customTotal}
            onChange={(e) => setCustomTotal(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-800"
          />
          <span className="text-[11px] text-zinc-400">Terbaca oleh OCR: {formatIDR(currentScan.totalAmountIDR)}</span>
        </div>

        <ProposalTable items={currentScan.items} inventoryItems={inventoryItems} onMapItem={updateItemMapping} />

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={confirmReceipt.isPending}
            onClick={handleConfirm}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 shadow-md shadow-blue-500/20"
          >
            {confirmReceipt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Simpan Kas &amp; Masuk ke Inventaris
          </button>
        </div>
      </div>
    </div>
  );
}
