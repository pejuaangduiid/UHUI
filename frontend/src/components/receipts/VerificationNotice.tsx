"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info, PackageCheck } from "lucide-react";

interface VerificationNoticeProps {
  isVerified: boolean;
  isSuspectDuplicate: boolean;
}

export function VerificationNotice({ isVerified, isSuspectDuplicate }: VerificationNoticeProps) {
  return (
    <div className="space-y-3">
      {isSuspectDuplicate ? (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-500 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-sm dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <span className="font-extrabold text-sm block">PERINGATAN: Ada Indikasi Kwitansi Duplikat!</span>
            <p className="mt-1 leading-relaxed">
              Ditemukan transaksi lain dengan tanggal dan nominal yang identik. Harap pastikan nota ini bukan pencatatan ganda sebelum disimpan.
            </p>
          </div>
        </div>
      ) : isVerified ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#B9C8DD] bg-[#DFE9F1]/60 p-3.5 text-xs text-[#1D5FAE] dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1D5FAE] dark:text-blue-400" />
            <div>
              <span className="font-bold">Status Terverifikasi Penuh</span>
              <p className="mt-0.5">
                Nominal transaksi sama persis dengan hasil OCR dan tidak terdeteksi duplikasi. Transaksi ini bernilai penuh pada Skor Kesiapan (Komponen C).
              </p>
            </div>
          </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#B9C8DD] bg-[#DFE9F1]/60 p-3.5 text-xs text-[#1D5FAE] dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
              <Info className="h-4 w-4 shrink-0 text-[#1D5FAE] dark:text-blue-400" />
              <div>
                <span className="font-bold">Pencatatan Mandiri</span>
                <p className="mt-0.5">
                  Terdapat perbedaan nominal antara hasil OCR dan penyesuaian Anda. Transaksi tetap dicatat sebagai valid namun berstatus unverified.
                </p>
              </div>
            </div>
      )}

              <div className="flex items-center gap-2 rounded-xl border border-[#B9C8DD] bg-[#DFE9F1]/40 p-3 text-xs text-[#1D5FAE] dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
                <PackageCheck className="h-4 w-4 shrink-0 text-[#1D5FAE] dark:text-blue-400" />
                <span>
                  <strong>Sinkronisasi Inventaris Otomatis:</strong> Seluruh item dari nota ini akan langsung dicatat ke stok inventaris UMKM.
                </span>
              </div>
            </div>
            );
}
