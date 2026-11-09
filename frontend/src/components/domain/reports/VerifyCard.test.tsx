import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { VerifyCard, type VerifyCardData } from "./VerifyCard";

describe("RF.VERIFY.1 Public Document Verification Privacy", () => {
  const baseData: VerifyCardData = {
    status: "authentic",
    doc_type: "sak_emkm",
    business_name: "Toko Berkah Abadi",
    sector: "Retail",
    period_start: "2026-10-01",
    period_end: "2026-10-31",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    created_at: "2026-10-30T10:00:00Z",
    figures: null,
  };

  it("does not render key figures when figures field is null (owner disabled)", () => {
    const html = renderToString(React.createElement(VerifyCard, { data: baseData }));

    expect(html).toContain("Toko Berkah Abadi");
    expect(html).toContain("Dokumen Resmi Terverifikasi");
    expect(html).not.toContain('data-testid="verified-figures"');
    expect(html).not.toContain("Total Penjualan:");
  });

  it("renders key figures when figures field is present (owner enabled)", () => {
    const dataWithFigures: VerifyCardData = {
      ...baseData,
      figures: {
        total_revenue_idr: 15_000_000,
        net_profit_idr: 4_500_000,
        tx_count: 85,
      },
    };

    const html = renderToString(React.createElement(VerifyCard, { data: dataWithFigures }));

    expect(html).toContain('data-testid="verified-figures"');
    expect(html).toContain("Total Penjualan:");
    expect(html).toContain("Laba Bersih Kas:");
    expect(html).toContain("85 transaksi");
  });
});

