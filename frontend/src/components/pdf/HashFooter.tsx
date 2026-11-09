import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

interface HashFooterProps {
  sha256: string;
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 6.5,
    color: "#9ca3af",
  },
  hash: {
    fontFamily: "Courier",
  },
});

export const HashFooter: React.FC<HashFooterProps> = ({ sha256 }) => {
  return (
    <View style={styles.footer} fixed>
      <Text style={[styles.text, styles.hash]}>SHA-256: {sha256}</Text>
      <Text style={styles.text}>Platform UHUI • Dokumen Resmi Terverifikasi</Text>
    </View>
  );
};

