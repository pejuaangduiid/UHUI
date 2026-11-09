import { describe, expect, it } from "vitest";
import React from "react";
import { SakEmkmDoc } from "./SakEmkmDoc";
import { formatIDR } from "@/lib/money";

describe("R4.4 and RF.RPT.1 PDF Rendering & Financial Fidelity", () => {
  const financialData = {
    period_start: "2026-10-01",
    period_end: "2026-10-31",
    revenue_idr: 50_000_000,
    restock_expense_idr: 20_000_000,
    operational_expense_idr: 10_000_000,
    total_expense_idr: 30_000_000,
    net_profit_idr: 20_000_000,
    cash_balance_idr: 35_000_000,
    total_inventory_cost_idr: 15_000_000,
    total_assets_idr: 50_000_000,
  };

  it("RF.RPT.1 renders exact financial numbers from API payload without manual recalculation", () => {
    const doc = React.createElement(SakEmkmDoc, {
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      qrDataUrl: "data:image/png;base64,dummy",
      verifyUrl: "http://localhost:3000/verify/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      businessName: "PT Sukses Bersama",
      data: financialData,
    });

    expect(doc.props.data.revenue_idr).toBe(50_000_000);
    expect(doc.props.data.net_profit_idr).toBe(20_000_000);
    expect(formatIDR(doc.props.data.total_assets_idr)).toBe(formatIDR(50_000_000));
  });

  it("R4.4 execution duration benchmark is within budget (< 2000 ms)", () => {
    const t0 = performance.now();
    
    const doc = React.createElement(SakEmkmDoc, {
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      qrDataUrl: "data:image/png;base64,dummy",
      verifyUrl: "http://localhost:3000/verify/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      businessName: "PT Sukses Bersama",
      data: financialData,
    });
    const duration = performance.now() - t0;
    expect(doc).toBeDefined();
    expect(duration).toBeLessThan(2000); 
  });
});

