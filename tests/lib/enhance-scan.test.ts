// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { enhanceScan } from "@/lib/image/enhance-scan";

describe("enhanceScan", () => {
  it("returns a valid image with the same dimensions", async () => {
    const input = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 120, g: 120, b: 120 } },
    })
      .jpeg()
      .toBuffer();

    const output = await enhanceScan(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(100);
  });

  it("stretches contrast on a low-contrast (washed-out) scan", async () => {
    // A narrow gray band (100-155) simulates a washed-out scan; normalize() should stretch
    // it toward the full 0-255 range, widening the min/max spread.
    const input = await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 32, height: 64, channels: 3, background: { r: 155, g: 155, b: 155 } },
          })
            .png()
            .toBuffer(),
          left: 32,
          top: 0,
        },
        {
          input: await sharp({
            create: { width: 32, height: 64, channels: 3, background: { r: 100, g: 100, b: 100 } },
          })
            .png()
            .toBuffer(),
          left: 0,
          top: 0,
        },
      ])
      .jpeg({ quality: 100 })
      .toBuffer();

    const inputStats = await sharp(input).stats();
    const outputStats = await sharp(await enhanceScan(input)).stats();

    const inputSpread = inputStats.channels[0].max - inputStats.channels[0].min;
    const outputSpread = outputStats.channels[0].max - outputStats.channels[0].min;

    expect(outputSpread).toBeGreaterThanOrEqual(inputSpread);
  });
});
