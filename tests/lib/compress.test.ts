// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { compressPdf } from "@/lib/pdf/compress";

async function makeNoisyJpeg(width: number, height: number, quality = 95): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
      noise: { type: "gaussian", mean: 128, sigma: 60 },
    },
  })
    .jpeg({ quality })
    .toBuffer();
}

async function makePdfWithImage(
  jpegBytes: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const image = await doc.embedJpg(jpegBytes);
  const page = doc.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });
  return Buffer.from(await doc.save());
}

describe("compressPdf", () => {
  it("keeps page count for image-less PDFs and reports no target", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    doc.addPage([200, 200]);
    const input = Buffer.from(await doc.save());

    const result = await compressPdf(input);
    const output = await PDFDocument.load(result.buffer);

    expect(output.getPageCount()).toBe(2);
    expect(result.targetMet).toBeNull();
  });

  it("meaningfully shrinks a PDF with a large embedded photo", async () => {
    const jpeg = await makeNoisyJpeg(1600, 1200, 95);
    const input = await makePdfWithImage(jpeg, 1600, 1200);

    const result = await compressPdf(input);

    expect(result.compressedSize).toBeLessThan(result.originalSize * 0.7);
    const output = await PDFDocument.load(result.buffer);
    expect(output.getPageCount()).toBe(1);
  });

  it("iterates toward a target size and reports whether it was met", async () => {
    const jpeg = await makeNoisyJpeg(1600, 1200, 95);
    const input = await makePdfWithImage(jpeg, 1600, 1200);

    const targetBytes = 40 * 1024;
    const result = await compressPdf(input, { targetBytes });

    expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    expect(typeof result.targetMet).toBe("boolean");
    if (result.targetMet) {
      expect(result.compressedSize).toBeLessThanOrEqual(targetBytes);
    }
  });
});
