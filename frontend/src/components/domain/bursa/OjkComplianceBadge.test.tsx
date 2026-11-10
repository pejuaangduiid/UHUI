import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { OjkComplianceBadge } from "./OjkComplianceBadge";

describe("OjkComplianceBadge", () => {
  it("renders partner and license information correctly", () => {
    const html = renderToString(
      React.createElement(OjkComplianceBadge, {
        partnerName: "Bizhare",
        licenseNumber: "KEP-71/D.04/2019",
        ojkCode: "OJK-SCF-001",
      })
    );

    expect(html).toContain("Bizhare");
    expect(html).toContain("KEP-71/D.04/2019");
    expect(html).toContain("Penyelenggara SCF:");
  });

  it("renders fallback text when partnerName is omitted", () => {
    const html = renderToString(
      React.createElement(OjkComplianceBadge, {})
    );

    expect(html).toContain("Mitra SCF Resmi Terdaftar");
    expect(html).toContain("POJK 17/2025");
    expect(html).toContain("Penyelenggara SCF:");
  });
});
