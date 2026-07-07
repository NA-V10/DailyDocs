// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { extractPdfImages } from "@/lib/pdf/extract-images";

async function makeJpeg(width: number, height: number, color: { r: number; g: number; b: number }) {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .jpeg({ quality: 90 })
    .toBuffer();
}

describe("extractPdfImages", () => {
  it("extracts a JPEG image embedded on a page", async () => {
    const jpeg = await makeJpeg(200, 150, { r: 200, g: 40, b: 40 });
    const doc = await PDFDocument.create();
    const image = await doc.embedJpg(jpeg);
    const page = doc.addPage([200, 150]);
    page.drawImage(image, { x: 0, y: 0, width: 200, height: 150 });
    const input = Buffer.from(await doc.save());

    const results = await extractPdfImages(input);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ pageIndex: 0, format: "jpg", width: 200, height: 150 });
    expect(results[0].data.length).toBeGreaterThan(0);
  });

  it("tags images with the correct page index across multiple pages", async () => {
    const jpegA = await makeJpeg(100, 100, { r: 255, g: 0, b: 0 });
    const jpegB = await makeJpeg(100, 100, { r: 0, g: 255, b: 0 });

    const doc = await PDFDocument.create();
    const imageA = await doc.embedJpg(jpegA);
    const pageA = doc.addPage([100, 100]);
    pageA.drawImage(imageA, { x: 0, y: 0, width: 100, height: 100 });

    doc.addPage([100, 100]); // page with no image in between

    const imageB = await doc.embedJpg(jpegB);
    const pageC = doc.addPage([100, 100]);
    pageC.drawImage(imageB, { x: 0, y: 0, width: 100, height: 100 });

    const input = Buffer.from(await doc.save());
    const results = await extractPdfImages(input);

    expect(results).toHaveLength(2);
    expect(results.find((r) => r.pageIndex === 0)).toBeDefined();
    expect(results.find((r) => r.pageIndex === 1)).toBeUndefined();
    expect(results.find((r) => r.pageIndex === 2)).toBeDefined();
  });

  it("returns an empty list for a PDF with no images", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const input = Buffer.from(await doc.save());

    const results = await extractPdfImages(input);
    expect(results).toEqual([]);
  });
});
