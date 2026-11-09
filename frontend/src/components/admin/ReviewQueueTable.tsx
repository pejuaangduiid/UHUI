"use client";

import React, { useState } from "react";
import { Download, Eye, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatWIB } from "@/lib/dates";
import { ResponsiveTable, type Column } from "../layout/ResponsiveTable";
import { DocReviewModal, type QueueItemData } from "./DocReviewModal";

interface ReviewQueueTableProps {
  items: QueueItemData[];
  onReviewSubmit: (id: string, status: "approved" | "rejected", note?: string) => Promise<void>;
}

const docTypeLabels: Record<string, string> = {
  nib: "NIB (Nomor Induk Berusaha)",
  npwp: "NPWP Usaha",
  pt_deed: "Akta Pendirian PT",
  sk_kemenkumham: "Akta PT / SK Kemenkumham",
  business_bank_account: "Rekening Bank Bisnis",
};

export function ReviewQueueTable({ items, onReviewSubmit }: ReviewQueueTableProps) {
  const [selectedDoc, setSelectedDoc] = useState<QueueItemData | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchSearch = item.business_name.toLowerCase().includes(search.toLowerCase()) || item.doc_type.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = items.filter((d) => d.status === "pending").length;
  const verifiedCount = items.filter((d) => d.status === "verified").length;
  const rejectedCount = items.filter((d) => d.status === "rejected").length;

  const columns: Column<QueueItemData>[] = [
    {
      header: "Nama Usaha",
      accessorKey: "business_name",
      className: "font-semibold text-zinc-900 dark:text-zinc-50",
    },
    {
      header: "Jenis Dokumen",
      cell: (item) => (
        <span className="rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 text-xs font-semibold">
          {docTypeLabels[item.doc_type] ?? item.doc_type.toUpperCase()}
        </span>
      ),
    },
    {
      header: "Status Kurasi",
      cell: (item) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${item.status === "verified" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : item.status === "rejected" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          }`}>
          {item.status === "verified" ? <CheckCircle2 className="h-3 w-3" /> : item.status === "rejected" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          <span>{item.status === "verified" ? "Terverifikasi" : item.status === "rejected" ? "Ditolak" : "Menunggu Kurasi"}</span>
        </span>
      ),
    },
    {
      header: "Tanggal Unggah",
      cell: (item) => formatWIB(item.created_at, "full"),
    },
    {
      header: "Aksi",
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.download_url && (
            <a href={item.download_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
              <Download className="h-3 w-3" /> Berkas
            </a>
          )}
          <button type="button" onClick={() => setSelectedDoc(item)} className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition">
            <Eye className="h-3 w-3" /> Kurasi
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari bisnis UMKM atau jenis dokumen..."
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#121827] dark:text-white"
        />
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#121827]">
          <button type="button" onClick={() => setStatusFilter("all")} className={`px-3 py-1 rounded-xl text-xs font-bold transition ${statusFilter === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500"}`}>Semua ({items.length})</button>
          <button type="button" onClick={() => setStatusFilter("pending")} className={`px-3 py-1 rounded-xl text-xs font-bold transition ${statusFilter === "pending" ? "bg-amber-500 text-white" : "text-amber-600"}`}>Menunggu ({pendingCount})</button>
          <button type="button" onClick={() => setStatusFilter("verified")} className={`px-3 py-1 rounded-xl text-xs font-bold transition ${statusFilter === "verified" ? "bg-[#1D5FAE] text-white" : "text-blue-600"}`}>Lolos ({verifiedCount})</button>
          <button type="button" onClick={() => setStatusFilter("rejected")} className={`px-3 py-1 rounded-xl text-xs font-bold transition ${statusFilter === "rejected" ? "bg-rose-600 text-white" : "text-rose-600"}`}>Ditolak ({rejectedCount})</button>
        </div>
      </div>
      <ResponsiveTable columns={columns} data={filtered} keyExtractor={(item) => item.id} emptyMessage="Tidak ada dokumen yang sesuai filter saat ini." />
      <DocReviewModal doc={selectedDoc} isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} onSubmit={onReviewSubmit} />
    </div>
  );
}
