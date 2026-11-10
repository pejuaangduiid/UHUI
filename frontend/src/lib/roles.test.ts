import { describe, it, expect } from "vitest";
import { formatUserRole } from "./roles";

describe("formatUserRole", () => {
  it("formats sme_owner as Pemilik Usaha", () => {
    expect(formatUserRole("sme_owner")).toBe("Pemilik Usaha");
  });

  it("formats investor as Investor", () => {
    expect(formatUserRole("investor")).toBe("Investor");
  });

  it("formats admin and superadmin as Admin", () => {
    expect(formatUserRole("admin")).toBe("Admin");
    expect(formatUserRole("superadmin")).toBe("Admin");
  });

  it("defaults empty or unknown to Investor", () => {
    expect(formatUserRole("")).toBe("Investor");
    expect(formatUserRole(null)).toBe("Investor");
    expect(formatUserRole(undefined)).toBe("Investor");
    expect(formatUserRole("unknown")).toBe("Investor");
  });
});

