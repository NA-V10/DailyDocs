import sharp from "sharp";

/**
 * A real, modest "scan enhancement": stretches contrast to use the full tonal
 * range (`normalize`) and applies light sharpening — not AI upscaling or
 * anything that invents detail. Only meaningful for raw image uploads (a
 * photographed/scanned document); images already embedded inside an uploaded
 * PDF are left untouched (see lib/pdf/compress.ts for why that's a separate,
 * more invasive operation).
 */
export async function enhanceScan(input: Buffer): Promise<Buffer> {
  return sharp(input).rotate().normalize().sharpen({ sigma: 0.8 }).toBuffer();
}
