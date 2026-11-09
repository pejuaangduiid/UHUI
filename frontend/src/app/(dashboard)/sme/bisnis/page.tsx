"use client";

import React, { useState } from "react";
import { useMySMEs } from "@/hooks/use-sme-list";
import { useSession } from "@/hooks/use-session";
import { AddBusinessModal } from "@/components/domain/sme/AddBusinessModal";
import { BusinessCard } from "@/components/domain/sme/BusinessCard";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function BisnisSayaPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: businesses, isLoading } = useMySMEs();
  const { smeId: activeSmeId, setSelectedSmeId } = useSession();

  const handleSelectBusiness = (id: string, name: string) => {
    setSelectedSmeId(id);
    toast.success(`Bisnis aktif beralih ke: ${name}`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E7EB] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1D5FAE] dark:text-blue-400">
            <Building2 className="h-4 w-4" />
            <span>Manajemen Portofolio Usaha</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white mt-1">
            Bisnis Saya
          </h1>
          <p className="text-xs text-[#516072] dark:text-slate-400 mt-0.5">
            Kelola beberapa unit usaha &amp; cabang operasional UMKM dalam satu akun terpusat.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] px-4 py-2 text-xs font-semibold text-white shadow-xs transition active:scale-[0.985]"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Bisnis Baru</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-44 rounded-[18px] border border-[#E2E7EB] dark:border-white/[0.08] bg-white/60 dark:bg-[#132235]/40 animate-pulse"
            />
          ))}
        </div>
      ) : !businesses || businesses.length === 0 ? (
        <div className="stitch-card p-12 text-center bg-white dark:bg-[#132235] border-dashed">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DFE9F1] dark:bg-blue-950/60 text-[#1D5FAE] dark:text-blue-300">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#0F1E2E] dark:text-white">
            Belum Ada Bisnis Terdaftar
          </h3>
          <p className="mt-1 text-xs text-[#516072] dark:text-slate-400 max-w-sm mx-auto">
            Daftarkan bisnis pertama Anda untuk mulai mencatat transaksi kasir POS, stok inventaris, dan laporan SAK EMKM.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-[11px] bg-[#1D5FAE] px-4 py-2 text-xs font-semibold text-white hover:bg-[#184e91] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Daftarkan Bisnis Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              biz={biz}
              isActive={activeSmeId === biz.id}
              onSelect={handleSelectBusiness}
            />
          ))}
        </div>
      )}

      <AddBusinessModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
