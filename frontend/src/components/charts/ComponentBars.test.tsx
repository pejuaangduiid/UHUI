import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ComponentBars } from "./ComponentBars";

describe("RF.SCORE.1 Component B Null Rendering", () => {
  it("renders 'Data belum cukup' badge with icon and text when Component B is null", () => {
    const html = renderToString(
      React.createElement(ComponentBars, {
        componentA: 85,
        componentB: null,
        componentC: 90,
        componentD: 75,
      })
    );

    expect(html).toContain('data-testid="component-b-null"');
    expect(html).toContain("Data belum cukup");
    expect(html).toContain("<svg");
  });

  it("renders numeric score when Component B is present", () => {
    const html = renderToString(
      React.createElement(ComponentBars, {
        componentA: 85,
        componentB: 70,
        componentC: 90,
        componentD: 75,
      })
    );

    expect(html).not.toContain('data-testid="component-b-null"');
    expect(html).toContain("70");
    expect(html).toContain("/ 100");
  });
});
