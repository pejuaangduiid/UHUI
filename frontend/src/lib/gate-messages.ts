

export interface GateInfo {
  code: string;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
}

export const GATE_MESSAGES: Record<string, GateInfo> = {
  NIB_BELUM_TERVERIFIKASI: {
    code: "NIB_BELUM_TERVERIFIKASI",
    title: "NIB Belum Terverifikasi",
    description: "Dokumen NIB belum disetujui kurator. Pastikan nomor dan lampiran NIB valid.",
    actionText: "Unggah / Periksa Dokumen",
    actionHref: "/sme/dokumen",
  },
  PT_TIDAK_SESUAI: {
    code: "PT_TIDAK_SESUAI",
    title: "Bukan Berbadan Hukum PT",
    description: "Skema Bursa Mikro-Ekuitas mensyaratkan entitas berbentuk Perseroan Terbatas (PT).",
    actionText: "Perbarui Profil Usaha",
    actionHref: "/sme/profil",
  },
  DOKUMEN_PT_BELUM_TERVERIFIKASI: {
    code: "DOKUMEN_PT_BELUM_TERVERIFIKASI",
    title: "SK Kemenkumham Belum Terverifikasi",
    description: "Dokumen legalitas pendirian PT / SK Kemenkumham belum disetujui kurator.",
    actionText: "Lengkapi Dokumen PT",
    actionHref: "/sme/dokumen",
  },
  DATA_BELUM_CUKUP: {
    code: "DATA_BELUM_CUKUP",
    title: "Data Restok Belum Cukup",
    description: "Komponen B memerlukan minimal 5 kali transaksi restok inventaris dalam 30 hari.",
    actionText: "Catat Restok Baru",
    actionHref: "/sme/transaksi",
  },
  RIWAYAT_KURANG: {
    code: "RIWAYAT_KURANG",
    title: "Riwayat Transaksi Kurang dari 14 Hari",
    description: "UMKM harus memiliki aktivitas pencatatan transaksi aktif minimal 14 hari.",
    actionText: "Lanjutkan Pembukuan Harian",
    actionHref: "/sme/kasir",
  },
  SKOR_DI_BAWAH_AMBANG: {
    code: "SKOR_DI_BAWAH_AMBANG",
    title: "Skor Belum Mencapai Ambang Batas",
    description: "Total skor kesiapan belum memenuhi ambang batas minimum (70 poin).",
    actionText: "Tingkatkan Aktivitas Usaha",
    actionHref: "/sme/skor",
  },
};

export function getGateInfo(code: string): GateInfo {
  return (
    GATE_MESSAGES[code] ?? {
      code,
      title: "Persyaratan Belum Terpenuhi",
      description: `Kode kegagalan: ${code}. Periksa kembali data bisnis Anda.`,
      actionText: "Periksa Data",
      actionHref: "/sme",
    }
  );
}

