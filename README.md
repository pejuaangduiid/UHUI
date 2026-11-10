# UHUI - Platform Digitalisasi UMKM & Bursa Mikro-Ekuitas

[![Live Website](https://img.shields.io/badge/Live%20Website-uhui.my.id-1D5FAE?style=flat&logo=googlechrome)](https://uhui.my.id)
[![Go Version](https://img.shields.io/badge/Go-1.27+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-4169E1?style=flat&logo=postgresql)](https://supabase.com)
[![Zero Docker](https://img.shields.io/badge/Docker-Zero%20Dependency%20(Native)-success?style=flat)](https://github.com)
[![Financial Math](https://img.shields.io/badge/Financial%20Math-Pure%20Integer%20%2F%200%20Float-orange?style=flat)](https://github.com)

> **Platform ekosistem terpadu untuk percepatan transformasi digital UMKM Indonesia:** mengubah data operasional harian kasir (POS) dan nota fisik menjadi tiket menuju pertumbuhan modal mikro-ekuitas berskema *Securities Crowdfunding* (POJK No. 17/2025), pembukuan standar SAK EMKM otomatis, pembuktian kelayakan via **Skor Kesiapan Investasi**, pendampingan **AI Financial Co-Pilot**, hingga **Ruang Rapat Pemegang Saham (Boardroom)** privat.

---

## 📌 Daftar Isi

1. [Latar Belakang Masalah & Solusi UHUI](#-latar-belakang-masalah--solusi-uhui)
2. [Target Pengguna (User Personas)](#-target-pengguna-user-personas)
3. [Fitur Utama](#-fitur-utama)
4. [Arsitektur Sistem & Tech Stack](#-arsitektur-sistem--tech-stack)
5. [Prasyarat Sistem](#-prasyarat-sistem)
6. [Cara Menjalankan Project (Quick Start)](#-cara-menjalankan-project-quick-start)
   - [1. Konfigurasi Environment Variables](#1-konfigurasi-environment-variables)
   - [2. Setup Dependensi](#2-setup-dependensi)
   - [3. Migrasi Database](#3-migrasi-database)
   - [4. Buat Akun Admin Pertama (Opsional)](#4-buat-akun-admin-pertama-opsional)
   - [5. Jalankan Development Server](#5-jalankan-development-server)
7. [Kamus Environment Variables](#-kamus-environment-variables)
8. [Disclaimer Regulasi & Lisensi](#-disclaimer-regulasi--lisensi)

---

## 💡 Latar Belakang Masalah & Solusi UHUI

### 1. Masalah Riil UMKM Indonesia
* **Keterbatasan Akses Modal (*Unbankable*):** Lebih dari 64 juta UMKM menopang 61% PDB nasional, namun mayoritas terhambat memperluas skala usaha karena tidak memiliki jaminan fisik (*collateral*) dan tidak memenuhi syarat kredit perbankan konvensional.
* **Pembukuan Tercecer & Tidak Terstandar:** Sebagian besar pencatatan kasir dan transaksi operasional masih dilakukan secara manual pada buku kertas, struk belanja supplier fisik hilang/rusak, dan ketiadaan laporan keuangan standar (SAK EMKM).
* **Jurang Regulasi Penawaran Efek:** Skema *Securities Crowdfunding* (SCF) sesuai **POJK Nomor 17 Tahun 2025** telah membuktikan penyaluran modal triliunan rupiah kepada ratusan penerbit, namun memerlukan rekam jejak tata kelola usaha, keterbukaan laporan keuangan, dan legalitas yang sulit dipenuhi UMKM secara mandiri.

### 2. Solusi Inovatif UHUI
UHUI (*UMKM Hub Indonesia*) hadir sebagai jembatan digital yang **mengubah data operasional harian menjadi aset kredibel untuk membuka akses modal**:
1. **Otomatisasi Pembukuan Kasir & AI Vision:** Tiap transaksi kasir POS dan foto struk belanja yang dipindai via *Google Gemini Vision OCR* langsung masuk ke sistem buku besar berpasangan (*double-entry ledger*), secara instan menghasilkan Laba Rugi dan Neraca standar SAK EMKM.
2. **Kalkulasi Skor Kesiapan Investasi (0-100):** Menilai kelayakan bisnis secara objektif berdasarkan 7 pilar kesiapan (profil, legalitas, kepatuhan kasir, stok, rasio keuangan, stabilitas operasional, dan integritas data).
3. **Sinergi SCF & Ruang Rapat Pemegang Saham:** Memfasilitasi penerbitan saham mikro-ekuitas yang bermitra dengan penyelenggara berizin OJK, dilengkapi fitur Ruang Rapat (*Boardroom*) tertutup bagi pemegang saham terverifikasi untuk musyawarah dividen dan transparansi usaha.

---

## 👥 Target Pengguna (User Personas)

| Peran Pengguna | Kebutuhan Utama | Nilai Manfaat dari UHUI |
|---|---|---|
| **Pelaku UMKM / Pemilik Usaha** | Mencatat penjualan kasir, merapikan stok, dan mencari tambahan modal usaha tanpa agunan perbankan. | POS instan, scanner nota otomatis, laporan SAK EMKM siap audit bank, diagnosis AI Co-Pilot, dan pembukaan kampanye saham mikro. |
| **Investor Ritel & Publik** | Ingin mendanai bisnis riil lokal yang transparan, menguntungkan, dan aman regulasi. | Katalog bursa saham mikro terkurasi, metrik keuangan transparan, simulator dividen, dan forum rapat pemegang saham privat. |
| **Kurator Kepatuhan / Administrator** | Mengawasi kepatuhan hukum, legalitas, dan keaslian dokumen bisnis. | Panel moderasi dokumen legal (NIB, NPWP, SK PT), verifikasi izin SCF OJK, dan pemantauan transaksi terisolasi. |
| **Mentor & Praktisi Bisnis** | Mendampingi UMKM naik kelas dan membagikan literasi tata kelola keuangan. | Platform akademi kursus terstruktur, webinar interaktif, dan forum diskusi komunitas UMKM. |

---

## ✨ Fitur Utama

* 🏪 **Point of Sale (POS) & Pembukuan SAK EMKM:** Antarmuka kasir cepat (*mobile & desktop*), sinkronisasi stok otomatis, dan pembukuan berpasangan (*double-entry ledger*) standar IAI tanpa pembulatan mengambang (*zero floating point*).
* 📸 **Pindai Nota AI Vision (Gemini Flash Multimodal OCR):** Ekstraksi digital nota supplier otomatis ke stok inventaris, dilengkapi proteksi deteksi foto palsu/bukan nota dan peringatan duplikasi nota ganda.
* 🤖 **AI Financial Co-Pilot Terjadwal:** Analisis keuangan harian otomatis via background scheduler (`gocron/v2`), deteksi anomali (*dead stock*, lonjakan harga modal, penurunan margin), dan rekomendasi taktis bisnis bebas PII.
* 📊 **Skor Kesiapan Investasi 7 Pilar (0-100):** Alat ukur transparansi dan kelayakan bisnis UMKM yang menguji ambang batas kesiapan sebelum membuka penawaran efek ke publik.
* 📄 **Dokumen Kriptografis SHA-256 & QR Code Verifikasi Publik:** Ekspor laporan SAK EMKM dan prospektus investasi ber-QR code dengan hash SHA-256 yang dapat diverifikasi publik tanpa login di `/verify/{hash}`.
* 📈 **Bursa Mikro-Ekuitas & Sinergi SCF OJK (POJK No. 17/2025):** Simulasi pasar saham mikro lokal dengan proteksi transaksi atomik (`SELECT ... FOR UPDATE`), pembagian dividen pro-rata integer (basis poin), serta fitur cek legalitas penyelenggara resmi OJK.
* 🏛️ **Ruang Rapat Pemegang Saham (*Private Boardroom*):** Forum diskusi eksklusif ber-RBAC khusus antara pemilik UMKM dan investor yang memiliki porsi saham terkonfirmasi untuk musyawarah agenda dan dividen.
* 🎓 **Akademi Kursus & Webinar Praktisi:** Modul pelatihan berjenjang tata kelola usaha, sesi webinar interaktif gratis, dan sertifikasi digital.
* 🌐 **Komunitas UMKM & Aksesibilitas LLM (`/llms.txt`):** Forum brainstorming solusi bisnis, metadata SEO dinamis (`FinancialProduct`, `Organization`), serta endpoint dokumentasi mesin `/llms.txt`.

---

## 🏛️ Arsitektur Sistem & Tech Stack

### Rincian Teknologi

| Lapisan | Teknologi | Keterangan & Peran |
|---|---|---|
| **Frontend Web** | Next.js 15 (App Router) | React 19, TypeScript 5, Tailwind CSS 4, Lucide Icons, perenderan hybrid SSR/CSR |
| **State & Fetch** | TanStack React Query + Zustand | Caching data server reaktif, mutasi optimistik, keranjang POS lokal |
| **Backend API** | Go 1.27+ | Fiber v3, Huma v2 (Otomatis menghasilkan OpenAPI 3.1 & Swagger UI) |
| **Database** | PostgreSQL / Supabase | Koneksi pooler `pgx/v5`, kueri aman tipe via `sqlc`, transaksi ACID atomik |
| **Migrasi DB** | Goose v3 | File migrasi terurut di `backend/internal/db/migrations` |
| **AI & Vision** | Google Gemini Vision API | Ekstraksi multimodal OCR struk fisik (`gemini-3.5-flash-lite`) |
| **Scheduler** | Gocron v2 | Eksekusi background job harian (AI Co-Pilot) & interval 15 menit (Auto-close kampanye) |
| **Dokumen & QR** | `@react-pdf/renderer` + `qrcode` | Pembuatan laporan PDF SAK EMKM dan prospektus sisi klien berkecepatan tinggi |
| **Pengujian** | Go Test & Vitest | Unit test modul finansial (100% coverage perhitungan integer) dan komponen UI |
| **Arsitektur Host** | **Native Execution (Zero Docker)** | Berjalan murni secara lokal tanpa ketergantungan kontainer yang berat |

---

## 📋 Prasyarat Sistem

Sebelum memulai instalasi, pastikan lingkungan komputer Anda telah terpasang:
1. **Go** (versi 1.27 atau lebih baru) - [Unduh Go](https://go.dev/dl/)
2. **Node.js** (versi 20 LTS atau lebih baru) & **npm** - [Unduh Node.js](https://nodejs.org/)
3. **Goose** (CLI migrasi database):
   ```powershell
   go install github.com/pressly/goose/v3/cmd/goose@latest
   ```
4. **golangci-lint** (opsional untuk verifikasi kode backend):
   ```powershell
   go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
   ```

---

## 🚀 Cara Menjalankan Project (Quick Start)

### 1. Konfigurasi Environment Variables

Salin file template `.env.example` ke `.env` pada root direktori:

```powershell
Copy-Item .env.example .env
```

Buka file `.env` dan sesuaikan nilainya:
```ini
# Aplikasi
APP_ENV=dev
HTTP_ADDR=:8080
ALLOWED_ORIGIN=http://localhost:3000

# Database (Supabase / PostgreSQL)
DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
TEST_DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require

# Cookie (true untuk pengembangan lokal di http://localhost)
COOKIE_INSECURE_DEV=true

# Storage
STORAGE_LOCAL_DIR=./tmp/storage
STORAGE_PUBLIC_BASE_URL=http://localhost:8080/api/v1/storage/dev

# AI Vision & OCR
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-3.5-flash-lite
```

Pastikan juga file `frontend/.env.local` telah terisi:
```ini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
API_ORIGIN=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-key>
```

---

### 2. Setup Dependensi

Jalankan skrip setup otomatis untuk mengunduh modul Go dan dependensi npm:

```powershell
powershell -File scripts/setup.ps1
```

*Atau instalasi manual:*
```powershell
# Backend
cd backend
go mod download
cd ..

# Frontend
cd frontend
npm install
cd ..
```

---

### 3. Migrasi Database

Jalankan seluruh migrasi Goose ke database PostgreSQL / Supabase Anda:

```powershell
powershell -File scripts/migrate.ps1 up
```

*Atau langsung via CLI Goose:*
```powershell
goose -dir backend/internal/db/migrations postgres "<DATABASE_URL>" up
```

---

### 4. Buat Akun Admin Pertama (Opsional)

Untuk mengakses dashboard peninjauan dokumen legal UMKM dan persetujuan kampanye bursa, buat akun admin awal via CLI:

```powershell
cd backend
go run cmd/admin/main.go create-admin --email admin@uhui.id --name "Administrator" --password password123
cd ..
```

---

### 5. Jalankan Development Server

#### **Opsi A: Satu Perintah (Direkomendasikan)**
Gunakan skrip `dev.ps1` untuk menyalakan Backend (:8080) dan Frontend (:3000) secara simultan:

```powershell
powershell -File scripts/dev.ps1
```

Tekan `Ctrl + C` kapan saja untuk menghentikan kedua server.

---

#### **Opsi B: Dua Terminal Terpisah**

* **Terminal 1 - Backend (Go Server)**:
  ```powershell
  cd backend
  go run cmd/server/main.go
  ```
  *Server aktif di: `http://localhost:8080` (Dokumentasi API Swagger di `http://localhost:8080/docs`)*

* **Terminal 2 - Frontend (Next.js)**:
  ```powershell
  cd frontend
  npm run dev
  ```
  *Aplikasi web aktif di: `http://localhost:3000`*

---

## 🔐 Kamus Environment Variables

### Backend (`.env`)

| Nama Variabel | Wajib/Opsional | Nilai Default | Deskripsi |
|---|---|---|---|
| `DATABASE_URL` | **Wajib** | `-` | Connection string PostgreSQL utama (Supabase session pooler). |
| `TEST_DATABASE_URL` | Opsional | `-` | Connection string database untuk pengujian integrasi `go test`. |
| `APP_ENV` | Opsional | `dev` | Mode lingkungan aplikasi (`dev` atau `production`). |
| `HTTP_ADDR` | Opsional | `:8080` | Alamat port HTTP listener backend Go. |
| `ALLOWED_ORIGIN` | Opsional | `http://localhost:3000` | Asal domain frontend yang diizinkan untuk CORS. |
| `COOKIE_INSECURE_DEV` | Opsional | `false` | Izinkan pengiriman cookie via HTTP tanpa TLS (hanya untuk `APP_ENV=dev`). |
| `STORAGE_LOCAL_DIR` | Opsional | `./tmp/storage` | Direktori lokal penyimpanan file/dokumen yang diunggah. |
| `STORAGE_PUBLIC_BASE_URL` | Opsional | `http://localhost:8080/api/v1/storage/dev` | URL publik dasar untuk mengakses file storage dev. |
| `GEMINI_API_KEY` | Opsional | `""` | Kunci API Google Gemini untuk pemindaian nota fisik (menggunakan FakeLLM jika kosong). |
| `GEMINI_MODEL` | Opsional | `gemini-3.5-flash-lite` | Model Gemini Vision yang digunakan untuk multimodal OCR. |

### Frontend (`frontend/.env.local`)

| Nama Variabel | Wajib/Opsional | Nilai Default | Deskripsi |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Wajib** | `http://localhost:3000` | URL domain publik frontend Next.js. |
| `API_ORIGIN` | **Wajib** | `http://localhost:8080` | Alamat host API backend untuk reverse proxy/fetch. |
| `NEXT_PUBLIC_SUPABASE_URL` | Opsional | `-` | URL endpoint proyek Supabase (bila menggunakan client SDK Supabase). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Opsional | `-` | Kunci publik anon Supabase untuk otentikasi browser. |

---

## ⚖️ Disclaimer Regulasi & Lisensi

> **Catatan Kepatuhan Regulasi:** Platform Bursa Mikro-Ekuitas pada UHUI dirancang selaras dengan prinsip **POJK Nomor 17 Tahun 2025** tentang Penyelenggaraan Layanan Urun Dana Melalui Penawaran Efek Berbasis Teknologi Informasi (*Securities Crowdfunding*). UHUI berperan sebagai ekosistem digitalisasi operasional, kurasi kesiapan data UMKM, dan perantara verifikasi laporan keuangan yang bermitra dengan penyelenggara berizin resmi Otoritas Jasa Keuangan (OJK).

Hak Cipta © 2026 UHUI Team. Dikembangkan dengan standar kode terbuka dan perlindungan privasi data.
