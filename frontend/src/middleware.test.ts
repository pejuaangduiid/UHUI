import { describe, expect, it } from "vitest";
import { config } from "./middleware";

describe("RF.SEC.1 Middleware Matcher Security", () => {
  it("only matches dashboard routes and excludes public routes", () => {
    const matcher = config.matcher;

    expect(matcher).toContain("/sme/:path*");
    expect(matcher).toContain("/invest/:path*");
    expect(matcher).toContain("/admin/:path*");

    const forbiddenInMatcher = ["/", "/bursa", "/verify", "/llms.txt", "/kebijakan-privasi"];
    for (const route of forbiddenInMatcher) {
      if (route === "/") {
        expect(matcher.includes("/")).toBe(false);
      } else {
        expect(matcher.some((pattern) => pattern.startsWith(route))).toBe(false);
      }
    }
  });
});
