import React from "react";
import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { isValidSha256 } from "@/lib/pdf/hash";
import { VerifyCard, type VerifyCardData } from "@/components/domain/reports/VerifyCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Verifikasi Keaslian Dokumen | UHUI",
  robots: { index: false, follow: false },
};

async function fetchVerification(hash: string): Promise<VerifyCardData | null> {
  const origin = process.env.API_ORIGIN || "http://localhost:8080";
  try {
    const res = await fetch(`${origin}/api/v1/verify/${hash}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const validHex = isValidSha256(hash);
  const data = validHex ? await fetchVerification(hash) : null;

  if (!data) {
    return (
            <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white flex items-center justify-center p-6">
              <div className="max-w-md w-full p-8 bg-white dark:bg-[#121827] border border-slate-200 dark:border-white/[0.08] rounded-3xl text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
                  <XCircle className="w-8 h-8" />
                </div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Dokumen Tidak Ditemukan</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Hash kriptografis tidak terdaftar pada sistem pembukuan UHUI atau dokumen telah kedaluwarsa.
                  </p>
                    <div className="p-3 bg-slate-100 dark:bg-[#151c2e] border border-slate-200 dark:border-white/[0.06] rounded-xl font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all select-all">
                      {hash}
                    </div>
                  </div>
                </main>
                );
  }

                return (
                  <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white flex items-center justify-center p-6 py-12">
                    <VerifyCard data={data} />
                  </main>
                  );
}
