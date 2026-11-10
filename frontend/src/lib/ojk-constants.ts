import type { components } from "@/types/api";

export type SCFPartner = components["schemas"]["SCFPartnerDTO"];
export type OJKCheckResult = components["schemas"]["OJKCheckResultDTO"];
export type SMEScreeningResult = components["schemas"]["SMEScreeningResultDTO"];

export const FALLBACK_SCF_PARTNERS: SCFPartner[] = [
  {
    id: "b1234567-0001-4000-8000-000000000001",
    brand_name: "Bizhare",
    entity_name: "PT Investasi Digital Nusantara",
    license_number: "KEP-71/D.04/2019",
    entity_type: "securities_crowdfunding",
    website_url: "https://bizhare.id",
    is_active: true,
  },
  {
    id: "b1234567-0002-4000-8000-000000000002",
    brand_name: "Santara",
    entity_name: "PT Santara Daya Inspiratama",
    license_number: "KEP-59/D.04/2019",
    entity_type: "securities_crowdfunding",
    website_url: "https://santara.co.id",
    is_active: true,
  },
  {
    id: "b1234567-0003-4000-8000-000000000003",
    brand_name: "LBS Urun Dana",
    entity_name: "PT LBS Urun Dana",
    license_number: "KEP-19/D.04/2021",
    entity_type: "securities_crowdfunding",
    website_url: "https://lbs.id",
    is_active: true,
  },
  {
    id: "b1234567-0004-4000-8000-000000000004",
    brand_name: "Eratani SCF",
    entity_name: "PT Eratani Berdaya Nusantara",
    license_number: "KEP-33/D.04/2022",
    entity_type: "securities_crowdfunding",
    website_url: "https://eratani.co.id",
    is_active: true,
  },
  {
    id: "b1234567-0005-4000-8000-000000000005",
    brand_name: "Shafiq",
    entity_name: "PT Shafiq Digital Indonesia",
    license_number: "KEP-37/D.04/2021",
    entity_type: "securities_crowdfunding",
    website_url: "https://shafiq.id",
    is_active: true,
  },
  {
    id: "b1234567-0006-4000-8000-000000000006",
    brand_name: "LandX",
    entity_name: "PT Numex Teknologi Indonesia",
    license_number: "KEP-11/D.04/2020",
    entity_type: "securities_crowdfunding",
    website_url: "https://landx.id",
    is_active: true,
  },
];

