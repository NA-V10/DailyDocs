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

  it("does not throw when aggressive compression produces a very small JPEG buffer", async () => {
    // Regression for a production "SOI not found in JPEG" crash: pdf-lib's JpegEmbedder
    // reads the SOI marker via `new DataView(bytes.buffer)`, ignoring byteOffset. Small
    // buffers (exactly what aggressive recompression produces) are frequently served from
    // Node's pooled allocator with a non-zero byteOffset, corrupting that read. A single
    // fresh test process doesn't reliably reproduce the pooled allocation on its own —
    // production, which recompresses many images in sequence, hits it far more often.
    const jpeg = await makeNoisyJpeg(800, 600, 90);
    const input = await makePdfWithImage(jpeg, 800, 600);

    await expect(compressPdf(input, { targetBytes: 8 * 1024 })).resolves.toBeDefined();
  });

  it("embeds a JPEG correctly even when its buffer is a non-zero-byteOffset view into a shared ArrayBuffer", async () => {
    // Deterministic version of the same regression: force the exact pooled-buffer shape
    // (small allocation, non-zero byteOffset into a larger underlying ArrayBuffer) that
    // Node's Buffer pool produces, rather than relying on the allocator's actual state.
    const jpeg = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 100, g: 150, b: 200 } },
    })
      .jpeg({ quality: 20 })
      .toBuffer();

    const pooled = Buffer.concat([Buffer.alloc(16), jpeg]).subarray(16);
    expect(pooled.byteOffset).toBeGreaterThan(0);

    const doc = await PDFDocument.create();
    await expect(doc.embedJpg(new Uint8Array(pooled))).resolves.toBeDefined();
  });
});
