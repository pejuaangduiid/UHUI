import { describe, expect, it } from "vitest";
import { isValidSha256, getVerifyUrl, truncateHash } from "./hash";

describe("R4.2 Cryptographic Hash and URL Helpers", () => {
  const validHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  it("validates 64-character lowercase hexadecimal hash", () => {
    expect(isValidSha256(validHash)).toBe(true);
    expect(isValidSha256(validHash.toUpperCase())).toBe(true);
  });

  it("rejects non-64 length strings or non-hex characters", () => {
    expect(isValidSha256("abc")).toBe(false);
    expect(isValidSha256("g".repeat(64))).toBe(false);
    expect(isValidSha256("")).toBe(false);
    expect(isValidSha256(validHash + "a")).toBe(false);
  });

  it("builds canonical verification URL", () => {
    const url = getVerifyUrl(validHash);
    expect(url).toContain(`/verify/${validHash}`);
  });

  it("truncates hash for display", () => {
    const truncated = truncateHash(validHash, 6, 6);
    expect(truncated).toBe("e3b0c4...52b855");
  });
});

