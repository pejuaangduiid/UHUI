import React from "react";
import Link from "next/link";
import Image from "next/image";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#E2E7EB] dark:border-white/[0.08] bg-[#F4F3F1] dark:bg-[#0A1624] text-[#516072] dark:text-slate-400 text-sm py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <Image
              src="/Logo.jpeg"
              alt="UHUI - UMKM Hub Indonesia"
              width={140}
              height={50}
              className="h-9 w-auto object-contain rounded-lg bg-white px-1.5 py-0.5 shadow-xs"
            />
          </div>
          <p className="text-xs leading-relaxed text-[#66727F] dark:text-slate-400">
            Ekosistem digitalisasi operasional UMKM, pembukuan standar SAK EMKM, dan akses pendanaan mikro-ekuitas berskema Securities Crowdfunding (POJK No. 17/2025).
          </p>
        </div>

        <div className="space-y-2.5">
          <h4 className="font-bold text-[#0F1E2E] dark:text-white text-xs uppercase tracking-wider">
            Fitur Operasional UMKM
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/sme/kasir" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Kasir POS &amp; Pembukuan SAK EMKM
              </Link>
            </li>
            <li>
              <Link href="/sme/nota" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Pindai Nota AI (Gemini Vision OCR)
              </Link>
            </li>
            <li>
              <Link href="/sme/copilot" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                AI Financial Co-Pilot Real-time
              </Link>
            </li>
            <li>
              <Link href="/sme/laporan" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Laporan Keuangan Terverifikasi
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <h4 className="font-bold text-[#0F1E2E] dark:text-white text-xs uppercase tracking-wider">
            Fitur Ekuitas &amp; Pendanaan
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/bursa" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Bursa Mikro-Ekuitas &amp; Pasar Saham
              </Link>
            </li>
            <li>
              <Link href="/sme/skor" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Skor Kesiapan Investasi 7 Pilar
              </Link>
            </li>
            <li>
              <Link href="/bursa" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Ruang Rapat Pemegang Saham
              </Link>
            </li>
            <li>
              <Link href="/bursa" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Cek Legalitas Penyelenggara OJK
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <h4 className="font-bold text-[#0F1E2E] dark:text-white text-xs uppercase tracking-wider">
            Edukasi &amp; Legalitas
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/kursus" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                LMS Kursus &amp; Webinar Praktisi
              </Link>
            </li>
            <li>
              <Link href="/komunitas" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Forum Diskusi &amp; Solusi UMKM
              </Link>
            </li>
            <li>
              <Link href="/kebijakan-privasi" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors">
                Kebijakan Privasi &amp; Ketentuan
              </Link>
            </li>
            <li>
              <a href="/llms.txt" className="text-[#66727F] dark:text-slate-400 hover:text-[#1D5FAE] dark:hover:text-white transition-colors" target="_blank" rel="noreferrer">
                Panduan AI (llms.txt)
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 pt-4 border-t border-[#E2E7EB] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#66727F] dark:text-slate-500">
        <span>&copy; {new Date().getFullYear()} UHUI Platform &bull; Digitalisasi UMKM Indonesia &amp; Sinergi SCF OJK</span>
        <span>Sesuai POJK Nomor 17 Tahun 2025</span>
      </div>
    </footer>
  );
}
