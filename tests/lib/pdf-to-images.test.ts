// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { pdfToImages } from "@/lib/pdf/to-images";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function makePdf(pageCount: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([200, 300]);
  }
  return Buffer.from(await doc.save());
}

async function makePdfWithImage(color: { r: number; g: number; b: number }): Promise<Buffer> {
  const jpeg = await sharp({
    create: { width: 200, height: 150, channels: 3, background: color },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  const doc = await PDFDocument.create();
  const image = await doc.embedJpg(jpeg);
  const page = doc.addPage([200, 150]);
  page.drawImage(image, { x: 0, y: 0, width: 200, height: 150 });
  return Buffer.from(await doc.save());
}

describe("pdfToImages", () => {
  it("produces one PNG per page", async () => {
    const input = await makePdf(3);
    const results = await pdfToImages(input, "doc");

    expect(results).toHaveLength(3);
    for (const result of results) {
      expect(result.data.subarray(0, 8)).toEqual(PNG_MAGIC);
    }
    expect(results[0].name).toBe("doc-page-1.png");
  });

  it("scales the raster size with the requested scale", async () => {
    const input = await makePdf(1);
    const small = await pdfToImages(input, "doc", 1);
    const large = await pdfToImages(input, "doc", 3);

    expect(large[0].data.length).toBeGreaterThan(small[0].data.length);
  });

  it("rejects PDFs over the page limit", async () => {
    const input = await makePdf(61);
    await expect(pdfToImages(input, "doc")).rejects.toThrow();
  });

  it("actually renders embedded page content, not a blank page", async () => {
    // Regression test: pdfjs-dist's Node canvas integration expects
    // @napi-rs/canvas specifically — the classic `canvas` package renders
    // vector content fine but throws/silently skips embedded raster images,
    // producing a blank page instead of the real content.
    const input = await makePdfWithImage({ r: 200, g: 30, b: 30 });
    const [result] = await pdfToImages(input, "doc", 2);

    const { data, info } = await sharp(result.data).raw().toBuffer({ resolveWithObject: true });

    let redPixels = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] > 150 && data[i + 1] < 100 && data[i + 2] < 100) redPixels++;
    }
    const totalPixels = data.length / info.channels;

    expect(redPixels / totalPixels).toBeGreaterThan(0.9);
  });
});
