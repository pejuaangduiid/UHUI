import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatIDR } from "@/lib/money";
import { QrBlock } from "./QrBlock";
import { HashFooter } from "./HashFooter";

interface ProspectusProps {
  sha256: string;
  qrDataUrl: string;
  verifyUrl: string;
  data: {
    business_name: string;
    sector: string;
    is_pt: boolean;
    description: string;
    readiness_score: number;
    component_a: number;
    component_b: number;
    component_c: number;
    component_d: number;
    revenue_30d_idr: number;
    expense_30d_idr: number;
    net_cash_30d_idr: number;
    simulation_label: string;
  };
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#1f2937" },
  banner: { backgroundColor: "#fef3c7", padding: 6, borderRadius: 4, marginBottom: 12, borderWidth: 0.5, borderColor: "#d97706" },
  bannerText: { fontSize: 7.5, color: "#92400e", textAlign: "center", fontWeight: "bold" },
  header: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#111827", paddingBottom: 6 },
  title: { fontSize: 16, fontWeight: "bold" },
  sub: { fontSize: 9, color: "#4b5563", marginTop: 2 },
  section: { marginTop: 10, marginBottom: 6 },
  sectionTitle: { fontSize: 10.5, fontWeight: "bold", borderBottomWidth: 0.5, paddingBottom: 2, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  rowBold: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5, fontWeight: "bold" },
  amount: { fontFamily: "Courier", fontWeight: "bold" },
});

export const ProspectusDoc: React.FC<ProspectusProps> = ({ sha256, qrDataUrl, verifyUrl, data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{data.simulation_label}</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Prospektus Ringkas & Profil Kesiapan</Text>
        <Text style={styles.sub}>{data.business_name} • Sektor {data.sector} • {data.is_pt ? "Badan Hukum PT" : "Perseorangan / CV"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Profil Usaha</Text>
        <Text style={{ fontSize: 8.5, color: "#4b5563", lineHeight: 1.3 }}>{data.description || "Profil operasional terverifikasi sistem UHUI."}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Skor Kesiapan Investasi (0-100)</Text>
        <View style={styles.rowBold}>
          <Text>Total Skor Kesiapan</Text>
          <Text style={styles.amount}>{data.readiness_score}/100</Text>
        </View>
        <View style={styles.row}>
          <Text>Komponen A: Konsistensi Catatan Harian</Text>
          <Text>{data.component_a}/100</Text>
        </View>
        <View style={styles.row}>
          <Text>Komponen B: Rasio Bukti Terverifikasi</Text>
          <Text>{data.component_b || "-"}/100</Text>
        </View>
        <View style={styles.row}>
          <Text>Komponen C: Kesehatan Arus Kas</Text>
          <Text>{data.component_c}/100</Text>
        </View>
        <View style={styles.row}>
          <Text>Komponen D: Kelengkapan Legalitas</Text>
          <Text>{data.component_d}/100</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Ringkasan Arus Kas 30 Hari Terakhir</Text>
        <View style={styles.row}>
          <Text>Penjualan 30 Hari</Text>
          <Text style={styles.amount}>{formatIDR(data.revenue_30d_idr)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Total Pengeluaran 30 Hari</Text>
          <Text style={styles.amount}>({formatIDR(data.expense_30d_idr)})</Text>
        </View>
        <View style={styles.rowBold}>
          <Text>Arus Kas Bersih Operasional</Text>
          <Text style={styles.amount}>{formatIDR(data.net_cash_30d_idr)}</Text>
        </View>
      </View>

      <QrBlock qrDataUrl={qrDataUrl} verifyUrl={verifyUrl} />
      <HashFooter sha256={sha256} />
    </Page>
  </Document>
);

