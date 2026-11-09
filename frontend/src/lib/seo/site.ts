import type { Metadata } from "next";

export const SITE_NAME = "UHUI";
export const SITE_DESCRIPTION =
  "Platform Digitalisasi UMKM, Tata Kelola Transparan & Bursa Mikro-Ekuitas (Simulasi Edukasi).";
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://uhui.example.com";

export function createMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const pageDesc = description || SITE_DESCRIPTION;
  const url = `${SITE_URL}${path}`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url,
      siteName: SITE_NAME,
      locale: "id_ID",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

