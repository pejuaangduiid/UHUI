import { describe, expect, it } from "vitest";
import { parseProblem } from "./errors";

describe("RFC 9457 Problem Details parser", () => {
  it("maps known error codes to friendly Indonesian messages", () => {
    const res = parseProblem({
      code: "INVALID_CREDENTIALS",
      status: 401,
    });
    expect(res.code).toBe("INVALID_CREDENTIALS");
    expect(res.message).toBe("Email atau kata sandi tidak cocok.");
    expect(res.hint).toContain("Periksa kembali");
  });

  it("falls back to problem detail or title if code is unmapped", () => {
    const res = parseProblem({
      title: "Something bad",
      detail: "Custom detail here",
      status: 400,
    });
    expect(res.message).toBe("Custom detail here");
  });
});

