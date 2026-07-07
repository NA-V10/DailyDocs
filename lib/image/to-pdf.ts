import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

/** Combines one or more images (any orientation/format) into a single PDF, one page per image. */
export async function imagesToPdf(images: Buffer[]): Promise<Buffer> {
  if (images.length === 0) {
    throw new Error("Select at least one image.");
  }

  const doc = await PDFDocument.create();

  for (const imageBuffer of images) {
    const normalized = await sharp(imageBuffer).rotate().png().toBuffer();
    const metadata = await sharp(normalized).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Could not read image dimensions.");
    }

    const pngImage = await doc.embedPng(normalized);
    const page = doc.addPage([metadata.width, metadata.height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: metadata.width,
      height: metadata.height,
    });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
