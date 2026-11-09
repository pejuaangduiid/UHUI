"use client";

import React, { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, Save } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useSMEProfile } from "@/hooks/use-documents";

export default function SMEProfilePage() {
  const { smeId } = useSession();
  const { profile, isLoading, updateProfile } = useSMEProfile(smeId);

  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("");
  const [description, setDescription] = useState("");
  const [isIncorporatedPt, setIsIncorporatedPt] = useState(false);
  const [verifyShowFigures, setVerifyShowFigures] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name ?? "");
      setSector(profile.sector ?? "");
      setDescription(profile.description ?? "");
      setIsIncorporatedPt(!!profile.is_incorporated_pt);
      setVerifyShowFigures(!!profile.verify_show_figures);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateProfile.mutateAsync({
        business_name: businessName.trim(),
        sector: sector.trim(),
        description: description.trim(),
        is_incorporated_pt: isIncorporatedPt,
        verify_show_figures: verifyShowFigures,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil");
    }
  };

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center text-xs text-slate-400">Memuat profil usaha...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Profil Entitas Usaha</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Kelola informasi badan usaha, legalitas, dan keterbukaan profil publik.</p>
        </div>
      </div>

      {error && <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-semibold text-rose-500">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nama Usaha / Merek Dagang</label>
          <input
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-white/[0.08] dark:bg-[#151c2e] text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sektor Industri / Usaha</label>
          <input
            type="text"
            required
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Contoh: Kuliner & Minuman (F&B) / Retail"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-white/[0.08] dark:bg-[#151c2e] text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Deskripsi Singkat Bisnis</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ceritakan model bisnis, produk unggulan, dan target pelanggan Anda."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-white/[0.08] dark:bg-[#151c2e] text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-[#151c2e]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isIncorporatedPt}
              onChange={(e) => setIsIncorporatedPt(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Badan Usaha Berbentuk PT (Perseroan Terbatas)</span>
              <p className="text-[11px] text-slate-400">Wajib jika ingin mendaftarkan penawaran saham pada Bursa Mikro-Ekuitas.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={verifyShowFigures}
              onChange={(e) => setVerifyShowFigures(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Izinkan Tampilan Angka Finansial pada Halaman Publik</span>
              <p className="text-[11px] text-slate-400">Membantu calon pemodal dan mitra melihat transparansi kesehatan finansial Anda.</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
            {saved ? "Tersimpan!" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
