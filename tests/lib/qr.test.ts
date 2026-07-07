// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generateQrPng } from "@/lib/qr/generate";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("generateQrPng", () => {
  it("produces a valid PNG buffer for text input", async () => {
    const buffer = await generateQrPng("https://example.com");
    expect(buffer.subarray(0, 8)).toEqual(PNG_MAGIC);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("respects the requested size", async () => {
    const small = await generateQrPng("hello", { size: 128 });
    const large = await generateQrPng("hello", { size: 512 });
    expect(large.length).toBeGreaterThan(small.length);
  });

  it("throws on empty text", async () => {
    await expect(generateQrPng("   ")).rejects.toThrow();
  });

  it("throws on text over the length limit", async () => {
    await expect(generateQrPng("a".repeat(3000))).rejects.toThrow();
  });
});
