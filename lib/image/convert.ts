import sharp from "sharp";

export type ImageFormat = "png" | "jpeg" | "webp" | "avif";

const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
};

const EXTENSION_BY_FORMAT: Record<ImageFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  avif: "avif",
};

export function mimeForFormat(format: ImageFormat): string {
  return MIME_BY_FORMAT[format];
}

export function extensionForFormat(format: ImageFormat): string {
  return EXTENSION_BY_FORMAT[format];
}

export async function convertImage(input: Buffer, format: ImageFormat): Promise<Buffer> {
  const pipeline = sharp(input).rotate(); // auto-orient based on EXIF before format never sees it again

  switch (format) {
    case "png":
      return pipeline.png().toBuffer();
    case "jpeg":
      return pipeline.jpeg({ quality: 90 }).toBuffer();
    case "webp":
      return pipeline.webp({ quality: 90 }).toBuffer();
    case "avif":
      return pipeline.avif({ quality: 60 }).toBuffer();
  }
}
