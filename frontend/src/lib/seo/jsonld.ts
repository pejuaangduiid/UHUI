import { SITE_NAME, SITE_URL } from "./site";

export interface CampaignJsonLdProps {
  slug: string;
  title: string;
  businessName: string;
  scheme: string;
  targetAmountIDR: number;
  minInvestmentIDR: number;
}

export function generateCampaignJsonLd(c: CampaignJsonLdProps) {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${c.title} - ${c.businessName} (Simulasi Edukasi)`,
    description: `Simulasi pendanaan skema ${c.scheme} untuk ${c.businessName}`,
    url: `${SITE_URL}/bursa/${c.slug}`,
    provider: {
      "@type": "Organization",
      name: c.businessName,
    },
    offers: {
      "@type": "Offer",
      price: c.minInvestmentIDR,
      priceCurrency: "IDR",
    },
    category: "Crowdfunding Simulation",
  };
}

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Platform Pembukuan Digital, Tata Kelola & Bursa Mikro-Ekuitas UMKM (Simulasi)",
  };
}

export function generateBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

