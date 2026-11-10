"use client";

import React, { useState } from "react";
import { useCreateMySME } from "@/hooks/use-sme-list";
import { useUiStore } from "@/stores/ui-store";
import { parseProblem } from "@/lib/api/errors";
import { X, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTORS = [
  "Kuliner & Kafe",
  "Retail & Toko Kelontong",
  "Jasa & Konsultasi",
  "Fashion & Pakaian",
  "Kerajinan & Seni",
  "Agribisnis & Peternakan",
  "Teknologi & Digital",
  "Kesehatan & Kecantikan",
  "Lainnya",
];

export function AddBusinessModal({ isOpen, onClose }: AddBusinessModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [description, setDescription] = useState("");
  const [isPt, setIsPt] = useState(false);

  const createSme = useCreateMySME();
  const setSelectedSmeId = useUiStore((s) => s.setSelectedSmeId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    createSme.mutate(
      {
        business_name: businessName.trim(),
        sector,
        description: description.trim(),
        is_incorporated_pt: isPt,
      },
      {
        onSuccess: (newSme) => {
          setSelectedSmeId(newSme.id);
          toast.success(`Bisnis "${newSme.business_name}" berhasil didaftarkan!`);
          setBusinessName("");
          setDescription("");
          setIsPt(false);
          onClose();
        },
        onError: (err: unknown) => {
          const problem = parseProblem(err);
          toast.error(problem.message, { description: problem.hint });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#121827]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.07] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Building2 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daftarkan Bisnis Baru</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Usaha / Brand *</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Contoh: Kopi Nusantara Jaya"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-white/[0.08] dark:bg-[#0b0f19] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sektor Usaha *</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-white/[0.08] dark:bg-[#0b0f19] dark:text-white"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Singkat Profil Usaha</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ringkas mengenai produk, lokasi, atau model bisnis..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-white/[0.08] dark:bg-[#0b0f19] dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPt}
              onChange={(e) => setIsPt(e.target.checked)}
              className="h-4 w-4 rounded text-[#1D5FAE] focus:ring-[#1D5FAE]"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Bisnis ini telah berbadan hukum PT / PT Perseorangan</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.07]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              Batal
            </button>
            <button
              type="submit"
              disabled={createSme.isPending || !businessName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D5FAE] hover:bg-[#184e91] text-xs font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {createSme.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {createSme.isPending ? "Mendaftarkan..." : "Simpan & Aktifkan Bisnis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
