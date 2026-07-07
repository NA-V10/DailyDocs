// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { compressImageToTarget } from "@/lib/image/compress-to-target";

async function makeNoisyPhoto(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 180, g: 180, b: 180 },
      noise: { type: "gaussian", mean: 150, sigma: 50 },
    },
  })
    .jpeg({ quality: 100 })
    .toBuffer();
}

describe("compressImageToTarget", () => {
  it("resizes to the exact target dimensions", async () => {
    const input = await makeNoisyPhoto(1200, 1600);
    const result = await compressImageToTarget(input, {
      width: 200,
      height: 230,
      minSizeBytes: 20 * 1024,
      maxSizeBytes: 50 * 1024,
    });

    const metadata = await sharp(result.data).metadata();
    expect(metadata.width).toBe(200);
    expect(metadata.height).toBe(230);
  });

  it("lands within the requested byte window for a realistic photo (SSC-style spec)", async () => {
    const input = await makeNoisyPhoto(1200, 1600);
    const result = await compressImageToTarget(input, {
      width: 200,
      height: 230,
      minSizeBytes: 20 * 1024,
      maxSizeBytes: 50 * 1024,
    });

    expect(result.sizeBytes).toBeGreaterThanOrEqual(20 * 1024);
    expect(result.sizeBytes).toBeLessThanOrEqual(50 * 1024);
    expect(result.meetsRequirement).toBe(true);
  });

  it("hits a narrow signature-style window (IBPS-style spec)", async () => {
    const input = await makeNoisyPhoto(800, 400);
    const result = await compressImageToTarget(input, {
      width: 140,
      height: 60,
      minSizeBytes: 10 * 1024,
      maxSizeBytes: 20 * 1024,
    });

    expect(result.sizeBytes).toBeLessThanOrEqual(20 * 1024);
  });

  it("never exceeds maxSizeBytes even when it can't hit the minimum", async () => {
    // A tiny, flat (near-zero-entropy) image compresses far below most minimums at any quality.
    const flat = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .jpeg()
      .toBuffer();

    const result = await compressImageToTarget(flat, {
      width: 50,
      height: 50,
      minSizeBytes: 100 * 1024, // unreachable for a 50x50 flat white image
      maxSizeBytes: 200 * 1024,
    });

    expect(result.sizeBytes).toBeLessThanOrEqual(200 * 1024);
  });
});
