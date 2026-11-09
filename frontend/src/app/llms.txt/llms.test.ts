import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("R11.2 llms.txt Route", () => {
  it("serves text/plain content with public API specifications for LLM agents", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");

    const text = await res.text();
    expect(text).toContain("Digitalisasi UMKM & Bursa Mikro-Ekuitas (Simulasi Edukasi)");
    expect(text).toContain("/api/v1/bursa");
    expect(text).toContain("/api/v1/verify/{sha256}");
    expect(text).toContain("SAK EMKM");
    expect(text).toContain("SIMULASI EDUKASI");
    expect(text).toContain("Zero Floating Point");
  });
});

