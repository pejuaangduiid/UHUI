-- +goose Up
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(220) UNIQUE NOT NULL,
  title VARCHAR(250) NOT NULL,
  description TEXT NOT NULL,
  instructor_name VARCHAR(150) NOT NULL,
  price_idr BIGINT NOT NULL DEFAULT 0 CHECK (price_idr >= 0),
  thumbnail_url TEXT,
  level VARCHAR(30) NOT NULL DEFAULT 'pemula' CHECK (level IN ('pemula', 'menengah', 'lanjutan')),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 1,
  title VARCHAR(250) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 15,
  video_url TEXT,
  content_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paid_idr BIGINT NOT NULL DEFAULT 0 CHECK (amount_paid_idr >= 0),
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, user_id)
);

CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(220) UNIQUE NOT NULL,
  title VARCHAR(250) NOT NULL,
  speaker_name VARCHAR(150) NOT NULL,
  speaker_role VARCHAR(150) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  banner_url TEXT,
  stream_url TEXT,
  related_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  is_free BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (webinar_id, user_id)
);

CREATE TABLE community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(220) UNIQUE NOT NULL,
  sector VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  icon_name VARCHAR(50) NOT NULL DEFAULT 'users',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_group_members (
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Seed Grup Sektoral
INSERT INTO community_groups (slug, sector, name, description, icon_name)
VALUES
  ('kuliner', 'F&B', 'Grup Kuliner, Kafe & Minuman', 'Wadah diskusi operasional dapur, resep, sertifikasi Halal, dan margin bisnis F&B.', 'utensils'),
  ('retail', 'Retail', 'Grup Retail, Warung & Minimarket', 'Optimasi rantai pasok warung, perputaran stok barang konsumsi, dan kasir POS.', 'shopping-bag'),
  ('fashion', 'Fashion', 'Grup Fashion & Kriya Kreatif', 'Eksplorasi tren busana, pengadaan bahan konveksi, hingga standardisasi mutu ekspor.', 'sparkles'),
  ('agrobisnis', 'Agrobisnis', 'Grup Agrobisnis, Tani & Peternakan', 'Diskusi hulu-hilir pertanian organik, peternakan modern, dan pembiayaan musim panen.', 'trees'),
  ('jasa', 'Jasa', 'Grup Jasa, Bengkel & Teknologi', 'Standardisasi layanan jasa bengkel, logistik, konsultan dan digitalisasi operasional.', 'wrench')
ON CONFLICT (slug) DO NOTHING;

-- Seed Kursus Unggulan HUBURK
INSERT INTO courses (id, slug, title, description, instructor_name, price_idr, level, is_published)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'tata-kelola-kasir-dan-stok', 'Tata Kelola Kasir, Stok, dan Pajak UMKM', 'Pelajari bagaimana mengelola pembukuan harian bebas selisih dengan sistem kasir POS terintegrasi dan rekonsiliasi stok opname berkala.', 'Budi Santoso, S.E.', 199000, 'pemula', true),
  ('c2222222-2222-2222-2222-222222222222', 'penyusunan-sak-emkm-terstandar', 'Penyusunan Laporan Keuangan SAK EMKM Terstandar', 'Panduan teknis step-by-step mencatat neraca dan laba rugi sesuai standar IAI agar usaha Anda dinilai layak oleh perbankan dan investor bursa.', 'Dra. Sri Wahyuni, Ak., CA', 299000, 'menengah', true),
  ('c3333333-3333-3333-3333-333333333333', 'tata-kelola-pt-dan-hubungan-investor', 'Tata Kelola Perseroan Terbatas & Hubungan Investor', 'Kiat menyusun prospektus, membagi dividen/bagi hasil, dan mengelola ruang rapat pemegang saham dengan amanah dan transparan.', 'Hendrawan, S.H., LL.M.', 499000, 'lanjutan', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Pelajaran Kursus 1
INSERT INTO course_lessons (course_id, sort_order, title, duration_minutes, content_text)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 1, 'Pengantar Digitalisasi Kasir UMKM', 15, 'Memahami pentingnya pemisahan kas pribadi dan kas kasir toko.'),
  ('c1111111-1111-1111-1111-111111111111', 2, 'Pencatatan Transaksi & Validasi Nota Fisik', 20, 'Cara menggunakan OCR nota dan kasir digital dengan kecepatan sub-detik.'),
  ('c1111111-1111-1111-1111-111111111111', 3, 'Manajemen Stok & Pencegahan Dead-Stock', 25, 'Menghitung batas aman inventaris dan harga pokok penjualan (HPP).')
ON CONFLICT DO NOTHING;

-- Seed Webinar Promosi Pelatihan Gratis
INSERT INTO webinars (id, slug, title, speaker_name, speaker_role, scheduled_at, related_course_id, is_free)
VALUES
  ('ba111111-1111-1111-1111-111111111111', 'akselerasi-umkm-ke-bursa', 'Akselerasi UMKM: Dari Pembukuan Kasir ke Bursa Saham Indonesia', 'Ir. H. Arsjad Rasjid', 'Ketua Umum Kadin Indonesia / Tim Ahli HUBURK', NOW() + INTERVAL '3 days', 'c1111111-1111-1111-1111-111111111111', true),
  ('ba222222-2222-2222-2222-222222222222', 'bedah-sak-emkm-ojk', 'Bedah Standar SAK EMKM & Kiat Lolos Verifikasi Pembiayaan Digital OJK', 'Dra. Sri Wahyuni, Ak., CA', 'Dewan Standar Akuntansi Keuangan UMKM', NOW() + INTERVAL '7 days', 'c2222222-2222-2222-2222-222222222222', true)
ON CONFLICT (slug) DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS community_group_members;
DROP TABLE IF EXISTS community_groups;
DROP TABLE IF EXISTS webinar_registrations;
DROP TABLE IF EXISTS webinars;
DROP TABLE IF EXISTS course_enrollments;
DROP TABLE IF EXISTS course_lessons;
DROP TABLE IF EXISTS courses;
