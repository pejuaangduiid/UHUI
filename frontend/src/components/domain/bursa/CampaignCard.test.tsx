import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { CampaignCard } from "./CampaignCard";
import { formatIDR } from "@/lib/money";

describe("R5.1 CampaignCard Whitelist Projection", () => {
  const dummyCampaign = {
    slug: "kopi-nikmat-123",
    title: "Ekspansi Kedai Kopi Nikmat",
    business_name: "Kopi Nikmat PT",
    sector: "F&B",
    scheme: "revenue_sharing",
    target_amount_idr: 50_000_000,
    raised_amount_idr: 25_000_000,
    min_investment_idr: 500_000,
    return_share_bps: 1200,
    term_months: 18,
    status: "open",
    closes_at: "2026-11-30T00:00:00Z",
    is_incorporated_pt: true,
    latest_readiness_score: 88,
  };

  it("renders safe public metadata and progress bar correctly", () => {
    const html = renderToString(
      React.createElement(CampaignCard, { campaign: dummyCampaign })
    );

    expect(html).toContain("Ekspansi Kedai Kopi Nikmat");
    expect(html).toContain("Kopi Nikmat PT");
    expect(html).toContain("F&amp;B");
    expect(html).toContain("12.00%"); 
    expect(html).toContain("18 Bln");
    expect(html).toContain("88/100");
    expect(html).toContain(formatIDR(500_000));
    expect(html).toContain("50%"); 
    expect(html).toContain("href=\"/bursa/kopi-nikmat-123\"");
  });
});
