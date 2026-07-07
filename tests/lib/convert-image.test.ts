// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { convertImage, mimeForFormat, extensionForFormat } from "@/lib/image/convert";

async function makeSourcePng(): Promise<Buffer> {
  return sharp({
    create: { width: 64, height: 48, channels: 3, background: { r: 20, g: 120, b: 220 } },
  })
    .png()
    .toBuffer();
}

describe("convertImage", () => {
  it("converts a PNG to JPEG", async () => {
    const input = await makeSourcePng();
    const output = await convertImage(input, "jpeg");
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(64);
    expect(metadata.height).toBe(48);
  });

  it("converts a PNG to WebP", async () => {
    const input = await makeSourcePng();
    const output = await convertImage(input, "webp");
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
  });

  it("converts a PNG to AVIF", async () => {
    const input = await makeSourcePng();
    const output = await convertImage(input, "avif");
    const metadata = await sharp(output).metadata();

    // AVIF is a HEIF-family container; sharp reports the container format
    // ("heif") rather than the brand string, depending on the libvips build.
    expect(["avif", "heif"]).toContain(metadata.format);
    expect(metadata.width).toBe(64);
    expect(metadata.height).toBe(48);
  });

  it("round-trips back to PNG", async () => {
    const input = await makeSourcePng();
    const jpeg = await convertImage(input, "jpeg");
    const backToPng = await convertImage(jpeg, "png");
    const metadata = await sharp(backToPng).metadata();

    expect(metadata.format).toBe("png");
  });
});

describe("mimeForFormat / extensionForFormat", () => {
  it("returns the correct MIME type and extension for each format", () => {
    expect(mimeForFormat("png")).toBe("image/png");
    expect(mimeForFormat("jpeg")).toBe("image/jpeg");
    expect(mimeForFormat("webp")).toBe("image/webp");
    expect(mimeForFormat("avif")).toBe("image/avif");

    expect(extensionForFormat("png")).toBe("png");
    expect(extensionForFormat("jpeg")).toBe("jpg");
    expect(extensionForFormat("webp")).toBe("webp");
    expect(extensionForFormat("avif")).toBe("avif");
  });
});
