import React from "react";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

interface AccessDeniedProps {
  businessName?: string;
  campaignSlug?: string;
}

export function AccessDenied({
  businessName = "UMKM",
  campaignSlug,
}: AccessDeniedProps) {
  return (
    <div className="border border-dashed rounded-2xl p-8 max-w-lg mx-auto text-center bg-card shadow-sm space-y-4 my-8">
      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center mx-auto">
        <Lock className="h-6 w-6" />
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-lg text-foreground">
          Ruang Rapat Pemegang Saham Terproteksi
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ruang rapat digital untuk <strong>{businessName}</strong> bersifat privat.
          Akses hanya diberikan kepada Pemilik Usaha dan investor dengan kepemilikan
          terkonfirmasi (Micro-Equity / Revenue Sharing).
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
        {campaignSlug ? (
          <Link
            href={`/bursa/${campaignSlug}`}
            className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Pelajari Prospektus di Bursa
          </Link>
        ) : (
          <Link
            href="/bursa"
            className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Lihat Katalog Bursa
          </Link>
        )}
        <Link
          href="/"
          className="border text-xs font-medium px-4 py-2 rounded-lg hover:bg-muted transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Beranda
        </Link>
      </div>
    </div>
  );
}

