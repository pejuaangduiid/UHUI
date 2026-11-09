"use client";

import React, { useState } from "react";
import { ShoppingCart, Printer } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useMySMEs } from "@/hooks/use-sme-list";
import { useInventory } from "@/hooks/use-inventory";
import { useTransactions } from "@/hooks/use-transactions";
import { ProductPicker } from "@/components/pos/ProductPicker";
import { CartList } from "@/components/pos/CartList";
import { PaymentBar, type CompletedReceiptItem } from "@/components/pos/PaymentBar";
import { ThermalReceiptModal, type ReceiptData } from "@/components/pos/ThermalReceiptModal";

export default function CashierPage() {
  const { smeId } = useSession();
  const { data: businesses } = useMySMEs();
  const { items, isLoading } = useInventory(smeId);
  const { createTx } = useTransactions(smeId);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const activeBiz = businesses?.find((b) => b.id === smeId) ?? businesses?.[0];

  const handleCheckout = async (
    cartItems: { inventory_item_id: string; qty: number; unit_price_idr: number }[],
    totalAmountIDR: number,
    receiptItems: CompletedReceiptItem[]
  ) => {
    await createTx.mutateAsync({
      tx_type: "sale",
      total_amount_idr: totalAmountIDR,
      description: `Penjualan Kasir (${cartItems.length} item)`,
      items: cartItems,
    });

    const newReceipt: ReceiptData = {
      receiptNo: `TRX-${Date.now().toString().slice(-6)}`,
      businessName: activeBiz?.business_name || "UMKM Binaan UHUI",
      sector: activeBiz?.sector,
      date: new Date(),
      items: receiptItems,
      totalAmountIDR,
    };
    setReceipt(newReceipt);
    setReceiptOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col space-y-4">
      {/* Kasir Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E7EB] dark:border-white/[0.08] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DFE9F1] dark:bg-blue-950/60 text-[#1D5FAE] dark:text-blue-300">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
              Kasir Penjualan (Point of Sale)
            </h1>
            <p className="text-xs text-[#516072] dark:text-slate-400">
              Pencatatan kas instan terhubung otomatis ke jurnal pembukuan SAK EMKM.
            </p>
          </div>
        </div>

        {receipt && (
          <button
            type="button"
            onClick={() => setReceiptOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] border border-[#E2E7EB] dark:border-white/10 bg-white dark:bg-[#132235] text-xs font-semibold text-[#0F1E2E] dark:text-white hover:bg-[#F4F3F1] dark:hover:bg-white/5 transition"
          >
            <Printer className="h-3.5 w-3.5 text-[#1D5FAE]" />
            <span>Cetak Struk Terakhir</span>
          </button>
        )}
      </div>

      {/* Main POS Split Layout (60% Catalog / 40% Cart Ticket) */}
      <div className="grid flex-1 grid-cols-1 gap-5 overflow-hidden lg:grid-cols-12">
        {/* Left: Product Catalog (7 cols ~ 60%) */}
        <div className="stitch-card flex flex-col overflow-hidden p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#516072] dark:text-slate-400">
              Katalog Produk &amp; Stok Barang
            </h2>
            <span className="text-[11px] font-semibold text-[#1D5FAE] dark:text-blue-400">
              {items?.length ?? 0} Item Terdaftar
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center text-xs text-[#516072] dark:text-slate-400">
              Memuat katalog inventaris...
            </div>
          ) : (
            <ProductPicker products={items} />
          )}
        </div>

        {/* Right: Order Cart Ticket (5 cols ~ 40%) */}
        <div className="stitch-card flex flex-col justify-between overflow-hidden p-5 lg:col-span-5">
          <div className="flex-1 overflow-y-auto pr-1">
            <CartList />
          </div>

          <div className="mt-4 border-t border-[#E2E7EB] dark:border-white/[0.08] pt-3">
            <PaymentBar onCheckout={handleCheckout} />
          </div>
        </div>
      </div>

      <ThermalReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={receipt}
      />
    </div>
  );
}
