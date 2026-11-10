import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "UHUI - Ekosistem Terpadu Keuangan UMKM & Bursa Mikro-Ekuitas",
  description:
    "Aplikasi pembukuan standar SAK EMKM, kasir POS, ruang rapat investor privat, dan bursa valuasi saham transparan UMKM Indonesia.",
  keywords: ["UMKM", "SAK EMKM", "Kasir POS", "Bursa Saham UMKM", "Pembukuan", "Digitalisasi UMKM", "UHUI"],
  authors: [{ name: "UHUI Platform Team" }],
  openGraph: {
    title: "UHUI - Ekosistem Terpadu Keuangan UMKM",
    description: "Platform pembukuan SAK EMKM, kasir POS, dan bursa mikro-ekuitas UMKM.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1C2C" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
