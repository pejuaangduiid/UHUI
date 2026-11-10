"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";
import { BusinessContextBar } from "@/components/domain/sme/BusinessContextBar";
import { useSession } from "@/hooks/use-session";
import { useMySMEs } from "@/hooks/use-sme-list";

export default function SmeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { smeId } = useSession();
  const { data: businesses } = useMySMEs();
  const currentBiz = businesses?.find((b) => b.id === smeId) ?? businesses?.[0];
  const isSuspended = Boolean(currentBiz?.is_suspended);

  const isBisnisManagement = pathname === "/sme/bisnis" || pathname.startsWith("/sme/bisnis/");

  if (isSuspended && !isBisnisManagement) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900 shadow-sm">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Akses Dibekukan (Ditangguhkan)
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1E2E] dark:text-white">
            Operasional Bisnis Dinonaktifkan Penuh
          </h1>
          <p className="text-sm text-[#516072] dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            Bisnis <strong>{currentBiz?.business_name}</strong> saat ini sedang ditangguhkan oleh Superadmin karena sanksi:
            <br />
            <span className="font-semibold text-rose-600 dark:text-rose-400 italic">
              &quot;{currentBiz?.suspension_reason || "Pelanggaran aturan operasional"}&quot;
            </span>
          </p>
          <p className="text-xs text-[#66727F] dark:text-slate-400 max-w-md mx-auto">
            Selama masa penangguhan, Anda tidak dapat mengakses kasir POS, transaksi kas, laporan keuangan, stok inventaris, pengajuan saham bursa, atau fitur operasional lainnya.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/sme/bisnis"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D5FAE] hover:bg-[#184e91] text-xs font-semibold text-white shadow-xs transition"
          >
            Buka Halaman Bisnis Saya &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const isExcluded =
    isBisnisManagement ||
    pathname === "/sme" ||
    pathname.startsWith("/sme/kursus");

  return (
    <div className="space-y-5">
      {!isExcluded && <BusinessContextBar />}
      {children}
    </div>
  );
}
