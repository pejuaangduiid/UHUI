import React from "react";
import { ReturnSimulator } from "@/components/domain/bursa/ReturnSimulator";
import { createMetadata } from "@/lib/seo/site";
import { HelpCircle } from "lucide-react";

export const metadata = createMetadata({
  title: "Simulasi & Kalkulator ROI Mikro-Ekuitas",
  description:
    "Hitung estimasi bagi hasil dan imbal hasil investasi mikro-ekuitas UMKM secara transparan berbasis pembukuan digital.",
  path: "/simulasi",
});

export default function SimulationPage() {
  return (
          <div className="container mx-auto px-6 py-12 max-w-5xl space-y-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Kalkulator Simulasi Bagi Hasil
              </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Simulasikan estimasi imbal hasil (ROI) berdasarkan skema pembagian keuntungan
                  dan proyeksi laba bersih operasional UMKM.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2">
                <ReturnSimulator
                  initialAmount={2_000_000}
                  returnShareBps={1500}
                  termMonths={12}
                  targetAmountIdr={50_000_000}
                />
              </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-4 text-xs">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cara Kerja Simulasi</h3>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      1. <strong className="text-slate-700 dark:text-slate-200">Bagi Hasil Terukur:</strong> Persentase keuntungan dihitung dari laba bersih bulanan yang dilaporkan UMKM melalui modul SAK EMKM.
                    </p>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        2. <strong className="text-slate-700 dark:text-slate-200">Distribusi Pro-Rata:</strong> Pembagian hasil kepada setiap pemegang saham/kontrak proporsional terhadap nilai investasinya.
                      </p>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          3. <strong className="text-slate-700 dark:text-slate-200">Transparansi Finansial:</strong> Setiap laporan keuangan diverifikasi dengan hash SHA-256 untuk memastikan integritas data tanpa manipulasi.
                        </p>
                      </div>
                  </div>
              </div>
              );
}
