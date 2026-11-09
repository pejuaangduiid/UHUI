import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ActionItems } from "./ActionItems";

describe("RF.AI.1 AI Co-Pilot Action Items", () => {
  const items = [
    { id: "act-1", text: "Kurangi pembelian barang lambat laku", done: false },
    { id: "act-2", text: "Foto dan verifikasi nota pembelian", done: true },
    { id: "act-3", text: "Pertimbangkan diskon akhir pekan", done: false },
  ];

  it("renders exactly 3 action items with their numbering and status", () => {
    const html = renderToString(
      React.createElement(ActionItems, {
        items,
        onToggle: () => {},
      })
    );

    expect(html).toContain("Aksi #1");
    expect(html).toContain("Aksi #2");
    expect(html).toContain("Aksi #3");
    expect(html).toContain("Kurangi pembelian barang lambat laku");
    expect(html).toContain("Foto dan verifikasi nota pembelian");
    expect(html).toContain("Pertimbangkan diskon akhir pekan");
  });

  it("applies strike-through styling to completed action items", () => {
    const html = renderToString(
      React.createElement(ActionItems, {
        items,
        onToggle: () => {},
      })
    );

    expect(html).toContain("line-through");
  });
});

