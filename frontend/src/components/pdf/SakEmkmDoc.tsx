import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatIDR } from "@/lib/money";
import { QrBlock } from "./QrBlock";
import { HashFooter } from "./HashFooter";

interface SakEmkmProps {
  sha256: string;
  qrDataUrl: string;
  verifyUrl: string;
  businessName: string;
  data: {
    period_start: string;
    period_end: string;
    revenue_idr: number;
    restock_expense_idr: number;
    operational_expense_idr: number;
    total_expense_idr: number;
    net_profit_idr: number;
    cash_balance_idr: number;
    total_inventory_cost_idr: number;
    total_assets_idr: number;
  };
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#1f2937" },
  header: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#111827", paddingBottom: 8 },
  title: { fontSize: 16, fontWeight: "bold" },
  sub: { fontSize: 9, color: "#4b5563", marginTop: 2 },
  section: { marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", borderBottomWidth: 0.5, paddingBottom: 3, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  rowBold: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, fontWeight: "bold" },
  amount: { fontFamily: "Courier", fontWeight: "bold" },
});

export const SakEmkmDoc: React.FC<SakEmkmProps> = ({ sha256, qrDataUrl, verifyUrl, businessName, data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Laporan Keuangan SAK EMKM</Text>
        <Text style={styles.sub}>{businessName} • Periode {data.period_start} s/d {data.period_end}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Laporan Laba Rugi</Text>
        <View style={styles.row}>
          <Text>Pendapatan Penjualan</Text>
          <Text style={styles.amount}>{formatIDR(data.revenue_idr)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Beban Pokok Penjualan (Restock)</Text>
          <Text style={styles.amount}>({formatIDR(data.restock_expense_idr)})</Text>
        </View>
        <View style={styles.row}>
          <Text>Beban Operasional</Text>
          <Text style={styles.amount}>({formatIDR(data.operational_expense_idr)})</Text>
        </View>
        <View style={styles.rowBold}>
          <Text>Laba Bersih Kas</Text>
          <Text style={styles.amount}>{formatIDR(data.net_profit_idr)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Neraca Ringkas</Text>
        <View style={styles.row}>
          <Text>Kas & Setara Kas</Text>
          <Text style={styles.amount}>{formatIDR(data.cash_balance_idr)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Persediaan Barang Dagang (Biaya Pokok)</Text>
          <Text style={styles.amount}>{formatIDR(data.total_inventory_cost_idr)}</Text>
        </View>
        <View style={styles.rowBold}>
          <Text>Total Aset</Text>
          <Text style={styles.amount}>{formatIDR(data.total_assets_idr)}</Text>
        </View>
      </View>

      <QrBlock qrDataUrl={qrDataUrl} verifyUrl={verifyUrl} />
      <HashFooter sha256={sha256} />
    </Page>
  </Document>
);

