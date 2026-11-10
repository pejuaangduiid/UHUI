import { describe, it, expect } from "vitest";
import { FALLBACK_SCF_PARTNERS } from "./ojk-constants";

describe("OJK Fallback Constants", () => {
  it("contains verified OJK SCF partners according to POJK 17/2025", () => {
    expect(FALLBACK_SCF_PARTNERS.length).toBeGreaterThanOrEqual(5);

    const bizhare = FALLBACK_SCF_PARTNERS.find((p) => p.brand_name === "Bizhare");
    expect(bizhare).toBeDefined();
    expect(bizhare?.license_number).toContain("KEP-71");

    const santara = FALLBACK_SCF_PARTNERS.find((p) => p.brand_name === "Santara");
    expect(santara).toBeDefined();
    expect(santara?.license_number).toContain("KEP-59");
  });

  it("every partner has active status and valid website", () => {
    for (const p of FALLBACK_SCF_PARTNERS) {
      expect(p.is_active).toBe(true);
      expect(p.website_url).toMatch(/^https:\/\//);
      expect(p.license_number).toBeTruthy();
    }
  });
});

