import { describe, expect, it } from "vitest";
import { compressImage, MAX_ORIGINAL_SIZE_BYTES } from "./image";

describe("RF.RCPT.1 Client-side Image Validation", () => {
  it("rejects image files strictly exceeding 5 MB", async () => {
    
    const oversizedFile = {
      name: "large_receipt.jpg",
      size: 6 * 1024 * 1024,
      type: "image/jpeg",
    } as unknown as File;

    await expect(compressImage(oversizedFile)).rejects.toThrow(
      "Ukuran file melebihi batas maksimal 5 MB"
    );
  });

  it("has MAX_ORIGINAL_SIZE_BYTES configured to exactly 5 MB", () => {
    expect(MAX_ORIGINAL_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });
});

