import { describe, expect, it } from "vitest";
import { GLOSSARY, term, termFull, termTooltip } from "./glossary";

describe("RF.GLOSS.1 Glossary Single Source of Truth", () => {
  it("provides definitions for all mandated business terms", () => {
    expect(GLOSSARY.cogs.label).toBe("Modal Pokok Barang");
    expect(GLOSSARY.netCashFlow.label).toBe("Uang Kas Bersih");
    expect(GLOSSARY.readinessScore.label).toBe("Skor Kesiapan Usaha");
    expect(GLOSSARY.revenueSharing.label).toBe("Patungan Hasil Usaha");
    expect(GLOSSARY.microShares.label).toBe("Saham Mikro");
    expect(GLOSSARY.simulationNotice.label).toContain("Simulasi");
    expect(GLOSSARY.pdpConsent.label).toContain("Perlindungan Data Pribadi");
  });

  it("returns helper string functions properly", () => {
    expect(term("cogs")).toBe("Modal Pokok Barang");
    expect(termFull("cogs")).toBe("Modal Pokok Barang (COGS)");
    expect(termTooltip("cogs")).toBeTruthy();
  });
});

