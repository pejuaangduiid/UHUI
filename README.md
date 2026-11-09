# UHUI — Platform Digitalisasi UMKM & Bursa Mikro-Ekuitas

[![Go Version](https://img.shields.io/badge/Go-1.27+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-4169E1?style=flat&logo=postgresql)](https://supabase.com)
[![Zero Docker](https://img.shields.io/badge/Docker-Zero%20Dependency%20(Native)-success?style=flat)](https://github.com)
[![Financial Math](https://img.shields.io/badge/Financial%20Math-Pure%20Integer%20%2F%200%20Float-orange?style=flat)](https://github.com)

> **Platform ekosistem terpadu untuk percepatan transformasi digital UMKM Indonesia:** menggabungkan alat operasional kasir (POS), pencatatan inventaris, pemindaian nota otomatis (OCR), pembukuan buku besar berpasangan (*double-entry ledger*), kalkulasi **Skor Kesiapan Digital (Readiness Score)**, **AI Business Co-Pilot**, hingga **Bursa Mikro-Ekuitas** dan **Ruang Rapat Pemegang Saham (Boardroom)**.

---

## 📌 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
3. [Prasyarat Sistem](#-prasyarat-sistem)
4. [Cara Menjalankan Project (Quick Start)](#-cara-menjalankan-project-quick-start)
   - [1. Konfigurasi Environment Variables](#1-konfigurasi-environment-variables)
   - [2. Setup Dependensi](#2-setup-dependensi)
   - [3. Migrasi Database](#3-migrasi-database)
   - [4. Buat Akun Admin Pertama (Opsional)](#4-buat-akun-admin-pertama-opsional)
   - [5. Jalankan Development Server](#5-jalankan-development-server)
5. [Disclaimer & Lisensi](#-disclaimer--lisensi)

---

## ✨ Fitur Utama

* 🏪 **Point of Sale (POS) & Operasional Harian**: Kasir responsif (*mobile & desktop*), manajemen inventaris, dan scanner nota belanja berbasis OCR yang langsung terhubung ke buku besar keuangan.
* 📒 **Buku Besar Berpasangan (*Double-Entry Ledger*)**: Mutasi keuangan atomik dan terisolasi dengan prinsip akuntansi standar (Debit/Kredit seimbang) tanpa pembulatan mengambang (*zero floating point*).
* 📊 **Skor Kesiapan Digital (*Readiness Score*)**: Evaluasi otomatis kelayakan UMKM (skor 0–100) berbasis 4 pilar: kelengkapan profil & legalitas, kepatuhan pencatatan, rasio kesehatan finansial, dan stabilitas operasional.
* 🤖 **AI Business Co-Pilot Terjadwal**: Analisis bisnis otomatis via scheduler harian (`gocron/v2` 00:00 WIB), deteksi anomali (*dead stock*, lonjakan harga modal, margin drop), dan 3 rekomendasi tindakan taktis bebas PII.
* 📄 **Dokumen Ekspor Finansial & Verifikasi Publik**: Ekspor laporan keuangan SAK EMKM, prospektus investasi, dan laporan bulanan ber-QR code dengan footer hash SHA-256 yang dapat diverifikasi publik tanpa login di `/verify/{hash}`.
* 📈 **Bursa Mikro-Ekuitas (Simulasi)**: Kampanye pendanaan transparan dengan proteksi transaksi atomik (`SELECT ... FOR UPDATE`), pembagian laba dividen pro-rata integer berbasis basis poin (`bps`), dan aturan penutupan sisa kuota (*remainder investment*).
* 🏛️ **Ruang Rapat Pemegang Saham (*Boardroom*)**: Ruang diskusi dan transparansi eksklusif terproteksi RBAC khusus bagi pemilik UMKM dan investor yang memiliki investasi terkonfirmasi.
* 🌐 **Komunitas Brainstorming Hub & SEO/AIO**: Forum publik untuk UMKM dan mentor, metadata SEO dinamis, structured data schema (`FinancialProduct`, `Organization`), serta endpoint `/llms.txt` untuk LLM crawler.

---

## 🛠️ Arsitektur & Tech Stack

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| **Backend API** | Go 1.27+ | Fiber v3, Huma v2 (Auto-generates OpenAPI 3.1 & Swagger) |
| **Database** | PostgreSQL / Supabase | Koneksi pooler `pgx/v5`, kueri aman tipe via `sqlc` |
| **Migrasi DB** | Goose | File migrasi terurut di `backend/internal/db/migrations` |
| **Scheduler** | Gocron v2 | Eksekusi background job harian (AI Co-Pilot) & interval 15 menit (Auto-close kampanye) |
| **Frontend Web** | Next.js 15 (App Router) | React 19, TypeScript 5, Tailwind CSS 4, Lucide Icons |
| **State & Fetch** | TanStack React Query + Zustand | Sinkronisasi data server dan keranjang POS lokal |
| **PDF & QR Code** | `@react-pdf/renderer` + `qrcode` | Perenderan sisi klien berkecepatan tinggi (< 2 detik) |
| **Testing** | Go Test & Vitest | 100% test coverage pada kalkulasi finansial dan alur inti |
| **Arsitektur Host** | **Native Execution (Zero Docker)** | Seluruh ekosistem berjalan murni secara lokal tanpa container |

---

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah terpasang:
1. **Go** (versi 1.27 atau lebih baru) — [Unduh Go](https://go.dev/dl/)
2. **Node.js** (versi 20 LTS atau lebih baru) & **npm** — [Unduh Node.js](https://nodejs.org/)
3. **Goose** (CLI migrasi database):
   ```powershell
   go install github.com/pressly/goose/v3/cmd/goose@latest
   ```
4. **golangci-lint** (opsional untuk verifikasi kode):
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

# Database (Supabase / PostgreSQL)
# Gunakan connection string database Anda (misal session pooler Supabase):
DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
TEST_DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require

# Cookie (true untuk pengembangan di http://localhost)
COOKIE_INSECURE_DEV=true

# Storage (local untuk dev)
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=.data/storage

# AI (opsional di dev - FakeLLM otomatis digunakan bila kosong)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Pastikan juga file `frontend/.env.local` telah terisi dengan benar:
```ini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
API_ORIGIN=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-key>
```

---

### 2. Setup Dependensi

Jalankan skrip setup otomatis untuk mengunduh modul Go dan dependensi frontend:

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

* **Terminal 1 — Backend (Go Server)**:
  ```powershell
  cd backend
  go run cmd/server/main.go
  ```
  *Server aktif di: `http://localhost:8080`*

* **Terminal 2 — Frontend (Next.js)**:
  ```powershell
  cd frontend
  npm run dev
  ```
  *Aplikasi web aktif di: `http://localhost:3000`*

---


## ⚖️ Disclaimer & Lisensi

> **Catatan Simulasi**: Platform Bursa Mikro-Ekuitas pada aplikasi ini merupakan **lingkungan simulasi edukasi dan pengujian sistem** untuk memvalidasi alur bisnis, kesiapan digital, dan transparansi laporan keuangan UMKM. Platform ini bukan penawaran efek komersial berdasarkan UU Pasar Modal Republik Indonesia.

Hak Cipta © 2026 UHUI Team. Dikembangkan dengan standar kode terbuka dan kepatuhan privasi data.

