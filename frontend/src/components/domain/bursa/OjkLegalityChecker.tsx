"use client";

import React, { useState } from "react";
import { useOJKCheck } from "@/hooks/use-ojk";
import { Search, ShieldCheck, AlertTriangle, HelpCircle, ExternalLink } from "lucide-react";

export function OjkLegalityChecker() {
  const [inputVal, setInputVal] = useState("");
  const [searchTerm, setSearchTerm] = useState("Bizhare");
  const { data, isLoading } = useOJKCheck(searchTerm);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchTerm(inputVal.trim());
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Cek Legalitas Entitas &amp; Instrumen OJK
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Periksa izin platform SCF, fintech, atau cek apakah entitas masuk daftar Satgas Waspada Investasi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ketik nama platform (cth: Bizhare, Santara, LandX)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pl-9 text-xs text-slate-900 focus:border-[#1D5FAE] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#1D5FAE] hover:bg-[#184e91] px-4 py-2 text-xs font-semibold text-white transition shadow-sm"
        >
          Cek
        </button>
      </form>

      {isLoading ? (
        <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : data ? (
        <div className="space-y-3">
          {data.status === "ILLEGAL_WARNING" && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                ⚠️ PERINGATAN: Terindikasi Masuk Daftar Satgas Waspada Investasi (SWI) OJK
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Entitas ini terindikasi beroperasi tanpa izin resmi OJK atau telah dihentikan kegiatannya.
              </p>
              {data.illegal_matches?.map((m) => (
                <div key={m.id} className="rounded-lg bg-white/60 p-2 text-[11px] dark:bg-black/20">
                  <span className="font-semibold">{m.entity_name}</span> &bull; {m.activity_type}
                </div>
              ))}
            </div>
          )}

          {data.status === "VERIFIED_LICENSED" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ✓ Terdaftar &amp; Berizin Resmi di OJK
              </div>
              {data.licensed_matches?.map((m) => (
                <div key={m.id} className="flex justify-between items-center rounded-lg bg-white/70 p-2 text-[11px] dark:bg-black/20">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{m.brand_name}</span>
                    <span className="text-slate-500 block text-[10px]">{m.entity_name} &bull; {m.license_number || "Berizin"}</span>
                  </div>
                  {m.website_url && (
                      <a href={m.website_url} target="_blank" rel="noreferrer" className="text-[#1D5FAE] dark:text-blue-400 underline flex items-center gap-0.5">
                        Situs <ExternalLink className="h-3 w-3" />
                      </a>
                  )}
                    </div>
                  ))}
                </div>
              )}

              {data.status === "NOT_FOUND_CLEAN" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-white/5 dark:bg-slate-900/40 dark:text-slate-300 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Tidak terdeteksi dalam daftar entitas ilegal SWI OJK. Tetap selalu pastikan izin penerbit sebelum berinvestasi.</span>
                </div>
              )}

              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Sumber: Publikasi OJK &amp; Satgas Waspada Investasi. UHUI bukan penyelenggara langsung komersial.
              </p>
            </div>
          ) : null}
        </div>
      );
}

