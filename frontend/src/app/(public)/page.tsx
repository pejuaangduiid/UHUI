import Link from "next/link";
import { ArrowRight, Receipt, CandlestickChart, Users2, GraduationCap } from "lucide-react";

export default function Home() {
  const cards = [
    { title: "Pembukuan & Kasir POS", desc1: "Pencatatan kas standar SAK EMKM.", desc2: "Cetak struk & pantau omzet real-time.", tag: "Modul Kas", icon: Receipt },
    { title: "Bursa & Trading Chart", desc1: "Valuasi mikro-ekuitas transparan.", desc2: "Bursa edukasi saham riil bisnis lokal.", tag: "Pasar Saham", icon: CandlestickChart },
    { title: "Komunitas & Boardroom", desc1: "Ruang rapat investor terverifikasi.", desc2: "Diskusi tata kelola & rantai pasok.", tag: "Boardroom", icon: Users2 },
    { title: "LMS Kursus & Webinar", desc1: "Kurikulum praktis tata kelola UMKM.", desc2: "Webinar berkala bersama praktisi.", tag: "Akademi", icon: GraduationCap },
  ];

  return (
    <div className="w-full bg-[#FAF9F6] dark:bg-[#0D1C2C] text-[#0F1E2E] dark:text-[#FAF9F6] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col items-center">
          <section className="text-center flex flex-col items-center max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-[#0F1E2E] dark:text-white leading-[1.14]">
              Aplikasi Pembukuan, Marketplace, &amp;<br className="hidden sm:inline" />{" "}
              Bursa Mikro-<span className="text-[#1D5FAE] dark:text-blue-400">Ekuitas UMKM</span>
            </h1>
            <p className="mt-5 max-w-xl text-center text-sm sm:text-base text-[#516072] dark:text-slate-300 leading-relaxed font-normal">
              Otomatisasi pencatatan kas standar SAK EMKM, ruang rapat investor privat, bursa valuasi saham transparan, dan program pelatihan gratis.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link href="/register" prefetch={true} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.985]">
                <span>Mulai Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/bursa" prefetch={true} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[11px] border border-[#0F1E2E] dark:border-white/20 bg-transparent text-[#0F1E2E] dark:text-white font-semibold text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all active:scale-[0.985]">
                <span>Jelajahi Bursa Saham</span>
              </Link>
            </div>
          </section>

          <section className="w-full mt-16 sm:mt-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((c) => {
                const Icon = c.icon;
                return (
                  <article key={c.title} className="stitch-card p-5 flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-[10px] bg-[#DFE9F1] dark:bg-blue-950/60 flex items-center justify-center text-[#1D5FAE] dark:text-blue-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-[14px] font-semibold text-[#0F1E2E] dark:text-white mt-4 mb-2">{c.title}</h2>
                      <div className="text-xs text-[#516072] dark:text-slate-400 space-y-1 leading-relaxed">
                        <p>{c.desc1}</p>
                        <p>{c.desc2}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-3 border-t border-[#E2E7EB] dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-[#1D5FAE] dark:text-blue-400">
                      <span>{c.tag}</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="w-full mt-12 sm:mt-16 stitch-card p-6 sm:p-8 bg-white dark:bg-[#132235]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1D5FAE]"></span>
                  <span className="text-xs font-semibold text-[#1D5FAE] uppercase tracking-wider">Kepatuhan Standar Akuntansi Keuangan (SAK EMKM)</span>
                </div>
                <h3 className="text-xl font-bold text-[#0F1E2E] dark:text-white">Laporan Keuangan Rapi Siap Diajukan ke Bank dan Investor</h3>
                <p className="text-xs sm:text-sm text-[#516072] dark:text-slate-300 leading-relaxed">
                  Tiap transaksi kasir langsung menghasilkan Laporan Laba Rugi, Posisi Keuangan (Neraca), dan Catatan atas Laporan Keuangan secara otomatis tanpa perlu akuntan manual.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <Link href="/simulasi" className="w-full sm:w-auto text-center px-4 py-2.5 rounded-[11px] border border-[#E2E7EB] dark:border-white/10 text-xs font-semibold text-[#0F1E2E] dark:text-white hover:bg-slate-50 transition">
                  Coba Simulasi SAK EMKM
                </Link>
                <Link href="/register" className="w-full sm:w-auto text-center px-5 py-2.5 rounded-[11px] bg-[#1D5FAE] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition">
                  Daftarkan Usaha
                </Link>
              </div>
            </div>
          </section>
      </div>
    </div>
  );
}
