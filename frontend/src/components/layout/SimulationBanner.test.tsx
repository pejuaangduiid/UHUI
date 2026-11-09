import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SimulationBanner } from "./SimulationBanner";

describe("R11.1 SimulationBanner", () => {
    it("renders mandatory educational simulation disclaimer and dismiss button", () => {
      const html = renderToString(React.createElement(SimulationBanner));

      expect(html).toContain("PERINGATAN:");
      expect(html).toContain("SIMULASI EDUKASI");
      expect(html).toContain("Bukan penawaran efek komersial riil terdaftar OJK");
      expect(html).toContain("Tutup pemberitahuan simulasi");
    });
  });

