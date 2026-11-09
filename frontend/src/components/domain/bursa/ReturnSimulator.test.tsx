import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ReturnSimulator } from "./ReturnSimulator";
import { formatIDR } from "@/lib/money";

describe("R5.2 ReturnSimulator", () => {
  it("renders calculation with zero float and accurate integer math", () => {

    const html = renderToString(
      React.createElement(ReturnSimulator, {
        initialAmount: 2_000_000,
        returnShareBps: 1500,
        termMonths: 12,
        targetAmountIdr: 50_000_000,
      })
    );

    expect(html).toContain("Kalkulator Simulasi ROI");
    expect(html).toContain("15.00% dari Laba");
    expect(html).toContain("12 Bulan");
    expect(html).toContain(formatIDR(90_000)); 
    expect(html).toContain(formatIDR(1_080_000)); 
    expect(html).toContain("Hanya Estimasi");
  });
});
