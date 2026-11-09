import React from "react";
import Link from "next/link";
import Image from "next/image";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#E2E7EB] dark:border-white/[0.08] bg-[#F4F3F1] dark:bg-[#0A1624] text-[#516072] dark:text-slate-400 text-sm py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <Image
                src="/Logo.jpeg"
                alt="UHUI - UMKM Hub Indonesia"
                width={140}
                height={50}
                className="h-9 w-auto object-contain rounded-lg bg-white px-1.5 py-0.5 shadow-xs"
              />
              <span className="text-xs font-semibold text-[#516072] dark:text-slate-400">Sandbox Edukasi</span>
            </div>
            <p className="text-xs leading-relaxed max-w-md text-[#66727F] dark:text-slate-400">
              Platform simulasi pembukuan standar SAK EMKM, kasir POS, dan instrumen kepemilikan mikro untuk penguatan kapabilitas UMKM Indonesia.
              Seluruh transaksi pendanaan pada sistem ini adalah <strong>simulasi edukatif</strong> dan tidak melibatkan efek komersial terdaftar OJK.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-semibold text-[#0F1E2E] dark:text-white text-xs uppercase tracking-wider">
              Produk &amp; Modul
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/bursa" className="text-[#66727F] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white transition-colors">
                  Bursa &amp; Valuasi Saham
                </Link>
              </li>
              <li>
                <Link href="/sme/kasir" className="text-[#66727F] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white transition-colors">
                  Kasir Penjualan POS
                </Link>
              </li>
              <li>
                <Link href="/simulasi" className="text-[#66727F] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white transition-colors">
                  Simulasi Keuntungan &amp; Dividen
                </Link>
              </li>
              <li>
                <Link href="/komunitas" className="text-[#66727F] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white transition-colors">
                  Komunitas &amp; Solusi UMKM
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-semibold text-[#0F1E2E] dark:text-white text-xs uppercase tracking-wider">
              Bantuan &amp; Kepatuhan
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/kursus" className="text-[#66727F] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white transition-colors">
                  Panduan Tata Kelola SAK EMKM
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="text-[#66727F] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white transition-colors">
                  Privasi &amp; Syarat Ketentuan
                </Link>
              </li>
              <li>
                <a href="/llms.txt" className="text-[#66727F] dark:text-slate-400 hover:text-[#0F1E2E] dark:hover:text-white transition-colors" target="_blank" rel="noreferrer">
                  llms.txt (Panduan AI Co-Pilot)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 pt-4 border-t border-[#E2E7EB] dark:border-white/[0.08] text-xs text-center text-[#66727F] dark:text-slate-500">
          &copy; {new Date().getFullYear()} UHUI Platform. Terdaftar dalam Program Sandbox Literasi Digital UMKM.
        </div>
    </footer>
  );
}
