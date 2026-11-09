import React from "react";
import { View, Image, Text, StyleSheet } from "@react-pdf/renderer";

interface QrBlockProps {
  qrDataUrl: string;
  verifyUrl: string;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  image: {
    width: 75,
    height: 75,
  },
  caption: {
    fontSize: 7,
    color: "#6b7280",
    marginTop: 4,
  },
});

export const QrBlock: React.FC<QrBlockProps> = ({ qrDataUrl, verifyUrl }) => {
  if (!qrDataUrl) return null;

  return (
    <View style={styles.container}>
      
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={qrDataUrl} style={styles.image} />
      <Text style={styles.caption}>Pindai QR untuk memverifikasi keaslian</Text>
      <Text style={styles.caption}>{verifyUrl}</Text>
    </View>
  );
};

