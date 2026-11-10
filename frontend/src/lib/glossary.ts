
export const GLOSSARY = {
  cogs: {
    label: "Modal Pokok Barang",
    full: "Modal Pokok Barang (COGS)",
    tooltip: "Biaya perolehan barang dagangan yang dikeluarkan untuk menghasilkan penjualan.",
  },
  netCashFlow: {
    label: "Uang Kas Bersih",
    full: "Uang Kas Bersih (Net Cash Flow)",
    tooltip: "Selisih antara total uang kas masuk dan total uang kas keluar dalam satu periode.",
  },
  readinessScore: {
    label: "Skor Kesiapan Usaha",
    full: "Skor Kesiapan Usaha (Readiness Score)",
    tooltip: "Indeks penilaian kesiapan tata kelola dan kesehatan finansial usaha (0-100).",
  },
  revenueSharing: {
    label: "Patungan Hasil Usaha",
    full: "Patungan Hasil Usaha (Revenue Sharing)",
    tooltip: "Skema pembiayaan berbasis bagi hasil dari pendapatan atau keuntungan kotor usaha.",
  },
  microShares: {
    label: "Saham Mikro",
    full: "Saham Mikro (Equity Crowdfunding)",
    tooltip: "Penerbitan kepemilikan saham mikro khusus untuk perseroan terbatas (PT).",
  },
  simulationNotice: {
    label: "Simulasi, bukan penawaran efek",
    full: "Platform simulasi edukatif, bukan penawaran efek komersial menurut UU Pasar Modal.",
    tooltip: "Semua data kampanye bursa di UHUI adalah simulasi edukasi tata kelola.",
  },
  pdpConsent: {
    label: "Persetujuan Perlindungan Data Pribadi",
    full: "Persetujuan Pemrosesan Data Pribadi (UU PDP No. 27/2022)",
    tooltip: "Data pribadi dan keuangan diproses secara aman sesuai regulasi UU PDP.",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;

export function term(key: GlossaryKey): string {
  return GLOSSARY[key].label;
}

export function termFull(key: GlossaryKey): string {
  return GLOSSARY[key].full;
}

export function termTooltip(key: GlossaryKey): string {
  return GLOSSARY[key].tooltip;
}

