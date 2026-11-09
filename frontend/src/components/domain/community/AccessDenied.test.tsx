import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { AccessDenied } from "./AccessDenied";

describe("R6.1 AccessDenied Boardroom Barrier", () => {
  it("renders boardroom protection explanation and link to campaign", () => {
    const html = renderToString(
      React.createElement(AccessDenied, {
        businessName: "Kopi Bersama PT",
        campaignSlug: "kopi-bersama",
      })
    );

    expect(html).toContain("Ruang Rapat Pemegang Saham Terproteksi");
    expect(html).toContain("Kopi Bersama PT");
    expect(html).toContain("Akses hanya diberikan kepada Pemilik Usaha dan investor");
    expect(html).toContain("href=\"/bursa/kopi-bersama\"");
  });
});
