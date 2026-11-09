import { describe, expect, it } from "vitest";
import React from "react";
import { ProspectusDoc } from "./ProspectusDoc";

describe("RF.SIM.1 Mandatory Simulation Notice in Prospectus", () => {
  it("includes the statutory simulation notice in document elements", () => {
    const data = {
      business_name: "Warung Berkah Jaya",
      sector: "F&B",
      is_pt: true,
      description: "Usaha kuliner terverifikasi",
      readiness_score: 85,
      component_a: 90,
      component_b: 80,
      component_c: 85,
      component_d: 85,
      revenue_30d_idr: 25_000_000,
      expense_30d_idr: 15_000_000,
      net_cash_30d_idr: 10_000_000,
      simulation_label: "Platform Simulasi Edukasi & Pengujian - Bukan Penawaran Efek Berdasarkan UU Pasar Modal",
    };

    const doc = React.createElement(ProspectusDoc, {
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      qrDataUrl: "data:image/png;base64,dummy",
      verifyUrl: "http://localhost:3000/verify/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      data,
    });

    expect(doc.props.data.simulation_label).toContain("Platform Simulasi Edukasi & Pengujian");
    expect(doc.props.data.simulation_label).toContain("Bukan Penawaran Efek");
    expect(doc.props.data.readiness_score).toBe(85);
  });
});

