"use client";

import React, { useState } from "react";
import { ShieldCheck, Info, X } from "lucide-react";

interface OjkComplianceBadgeProps {
  partnerName?: string | null;
  licenseNumber?: string | null;
  websiteUrl?: string | null;
  ojkCode?: string | null;
}

export function OjkComplianceBadge({
  partnerName,
  licenseNumber,
  websiteUrl,
  ojkCode,
}: OjkComplianceBadgeProps) {
  const [openModal, setOpenModal] = useState(false);

  const displayPartner = partnerName || "Mitra SCF Resmi Terdaftar";
  const displayLicense = licenseNumber || "Sesuai POJK 17/2025";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenModal(true)}
        className="group inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span>Penyelenggara SCF: {displayPartner}</span>
        <span className="text-[10px] text-blue-500/80">({displayLicense})</span>
        <Info className="h-3 w-3 opacity-60 group-hover:opacity-100" />
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#121827]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kepatuhan POJK Nomor 17 Tahun 2025
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Securities Crowdfunding (SCF)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500">Penyelenggara SCF:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{displayPartner}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500">Nomor Izin OJK:</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{displayLicense}</span>
              </div>
              {ojkCode && (
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-500">Kode Registrasi Efek:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">{ojkCode}</span>
                </div>
              )}
              {websiteUrl && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Portal Resmi:</span>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    Kunjungi Website
                  </a>
                </div>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              UHUI mengelola operasional pembukuan standar SAK EMKM dan menyalurkan penerbit ke Penyelenggara SCF berizin OJK. Penawaran efek dilakukan melalui platform penyelenggara terdaftar sesuai POJK 17/2025.
            </p>

            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Tutup Penjelasan
            </button>
          </div>
        </div>
      )}
    </>
  );
}

