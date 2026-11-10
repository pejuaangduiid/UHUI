import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { GLOSSARY } from "@/lib/glossary";

export const metadata = {
  title: "Kebijakan Privasi - UHUI",
  description: "Kebijakan perlindungan data pribadi pengguna platform simulasi UMKM UHUI.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <ThemeToggle />
        </header>

        <article className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Kebijakan Perlindungan Data Pribadi (UU PDP No. 27/2022)
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Terakhir diperbarui: 29 Oktober 2026. Berlaku untuk seluruh pengguna platform UHUI.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              1. Prinsip dan Dasar Pemrosesan Data
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              UHUI menghormati hak privasi dan memproses data pribadi Anda berdasarkan persetujuan eksplisit (
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                {GLOSSARY.pdpConsent.label}
              </span>
              ) yang Anda berikan saat pendaftaran. Seluruh pemrosesan dilakukan sesuai Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              2. Data yang Dikumpulkan
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Data Identitas:</strong> Nama lengkap, alamat email, dan kredensial akses yang di-hash dengan standar Argon2id.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Data Usaha:</strong> Nama usaha, sektor industri, dokumen legalitas (NIB, NPWP, Akta PT) yang diunggah secara sukarela.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Data Transaksi & Finansial:</strong> Catatan kas, inventaris, dan foto bukti nota fisik untuk keperluan simulasi pencatatan pembukuan SAK EMKM.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              3. Hak Pengguna & Anonimisasi Akun
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Pengguna berhak meminta perbaikan, pembatasan pemrosesan, dan penghapusan atau anonimisasi akun. Ketika akun dihapus, data identitas pribadi akan dianonimkan secara permanen sedangkan data riwayat pembukuan agregat dipertahankan demi integritas audit buku besar yang bersifat append-only.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              4. Batasan Simulasi
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Platform UHUI adalah media edukasi dan tata kelola digital. {GLOSSARY.simulationNotice.full}.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}

