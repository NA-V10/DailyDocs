// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { imagesToPdf } from "@/lib/image/to-pdf";

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
}

describe("imagesToPdf", () => {
  it("creates one page per image", async () => {
    const img1 = await makePng(100, 200);
    const img2 = await makePng(150, 150);
    const output = await imagesToPdf([img1, img2]);
    const doc = await PDFDocument.load(output);
    expect(doc.getPageCount()).toBe(2);
  });

  it("throws when no images are provided", async () => {
    await expect(imagesToPdf([])).rejects.toThrow();
  });
});
