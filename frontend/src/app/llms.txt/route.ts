import { NextResponse } from "next/server";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export async function GET() {
  const content = `# ${SITE_NAME} - Digitalisasi UMKM & Bursa Mikro-Ekuitas (Simulasi Edukasi)

> Platform pencatatan akuntansi standar SAK EMKM, verifikasi nota fisik berbasis AI OCR, dan simulasi bursa mikro-ekuitas UMKM Indonesia.

## 1. Ikhtisar & Sandbox Edukasi
Seluruh transaksi pendanaan dan pembagian hasil pada platform ini bersifat SIMULASI EDUKASI. Sistem dirancang untuk melatih literasi finansial pelaku UMKM dan investor tanpa transaksi efek komersial riil terdaftar OJK.

## 2. API Publik untuk Agen AI
- GET ${SITE_URL}/api/v1/bursa: Katalog kampanye mikro-ekuitas terbuka.
- GET ${SITE_URL}/api/v1/bursa/{slug}: Detail prospektus publik dan metrik pendanaan.
- GET ${SITE_URL}/api/v1/verify/{sha256}: Verifikasi integritas dokumen keuangan SAK EMKM.
- GET ${SITE_URL}/api/v1/community/hub/threads: Forum diskusi terbuka dan tantangan bisnis (bounties).

## 3. Aturan Finansial & Standar Akuntansi
- Mengikuti standar SAK EMKM (Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah).
- Perhitungan finansial strictly integer arithmetic dalam mata uang IDR (Zero Floating Point).
- Seluruh dokumen laporan keuangan menghasilkan digest hash kriptografis SHA-256 yang divalidasi publik.

## 4. Keamanan & Akses
- Endpoint publik menerapkan rate-limiting dan whitelisted projection (tidak membocorkan data pribadi atau PII pemilik usaha).
- Dokumen internal dan ruang rapat (boardroom) terenkripsi dan hanya dapat diakses pemegang saham terkonfirmasi.
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

