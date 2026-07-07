import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFRef,
  PDFNumber,
  PDFStream,
  PDFRawStream,
  PDFContext,
  PDFObject,
} from "pdf-lib";
import { inflateSync } from "zlib";
import sharp from "sharp";

export interface ExtractedPdfImage {
  pageIndex: number;
  data: Buffer;
  format: "jpg" | "png";
  width: number;
  height: number;
}

const DCT_DECODE = PDFName.of("DCTDecode");
const FLATE_DECODE = PDFName.of("FlateDecode");
const IMAGE_SUBTYPE = PDFName.of("Image");
const DEVICE_GRAY = PDFName.of("DeviceGray");
const DEVICE_RGB = PDFName.of("DeviceRGB");

function resolveMaybe(context: PDFContext, value: PDFObject | undefined): PDFObject | undefined {
  if (!value) return undefined;
  return value instanceof PDFRef ? context.lookup(value) : value;
}

/**
 * Extracts embedded raster images from a PDF as ready-to-embed JPEG/PNG
 * buffers, tagged with the (0-indexed) page they came from. Mirrors the
 * detection rules in lib/pdf/compress.ts: only handles the safely decodable
 * cases — JPEG (DCTDecode) and simple 8-bit Gray/RGB raw/FlateDecode samples
 * — and skips anything riskier to reprocess automatically (1-bit scans,
 * indexed palettes, CMYK raw samples, JPEG2000, transparency masks).
 */
export async function extractPdfImages(input: Buffer): Promise<ExtractedPdfImage[]> {
  const doc = await PDFDocument.load(input);
  const context = doc.context;
  const results: ExtractedPdfImage[] = [];
  const pages = doc.getPages();

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const resources = pages[pageIndex].node.Resources();
    if (!resources) continue;

    const xObjects = resolveMaybe(context, resources.get(PDFName.of("XObject")));
    if (!(xObjects instanceof PDFDict)) continue;

    for (const [, value] of xObjects.entries()) {
      if (!(value instanceof PDFRef)) continue;

      const streamObj = context.lookupMaybe(value, PDFStream);
      if (!(streamObj instanceof PDFRawStream)) continue;
      const stream = streamObj;

      const dict = stream.dict;
      const subtype = resolveMaybe(context, dict.get(PDFName.of("Subtype")));
      if (subtype !== IMAGE_SUBTYPE) continue;

      // Skip transparent images — compositing them correctly outside their
      // original page background isn't attempted here.
      if (dict.get(PDFName.of("SMask")) || dict.get(PDFName.of("Mask"))) continue;

      const bpcObj = resolveMaybe(context, dict.get(PDFName.of("BitsPerComponent")));
      if (!(bpcObj instanceof PDFNumber) || bpcObj.asNumber() !== 8) continue;

      const widthObj = resolveMaybe(context, dict.get(PDFName.of("Width")));
      const heightObj = resolveMaybe(context, dict.get(PDFName.of("Height")));
      if (!(widthObj instanceof PDFNumber) || !(heightObj instanceof PDFNumber)) continue;
      const width = widthObj.asNumber();
      const height = heightObj.asNumber();

      const filterObj = resolveMaybe(context, dict.get(PDFName.of("Filter")));

      if (filterObj === DCT_DECODE) {
        results.push({ pageIndex, data: Buffer.from(stream.contents), format: "jpg", width, height });
        continue;
      }

      if (filterObj === FLATE_DECODE || filterObj === undefined) {
        const decodeParms = resolveMaybe(context, dict.get(PDFName.of("DecodeParms")));
        if (decodeParms instanceof PDFDict) {
          const predictor = resolveMaybe(context, decodeParms.get(PDFName.of("Predictor")));
          if (predictor instanceof PDFNumber && predictor.asNumber() > 1) continue;
        }

        const colorSpaceObj = resolveMaybe(context, dict.get(PDFName.of("ColorSpace")));
        const channels: 1 | 3 | undefined =
          colorSpaceObj === DEVICE_GRAY ? 1 : colorSpaceObj === DEVICE_RGB ? 3 : undefined;
        if (!channels) continue;

        let raw: Buffer;
        try {
          raw =
            filterObj === FLATE_DECODE
              ? inflateSync(Buffer.from(stream.contents))
              : Buffer.from(stream.contents);
        } catch {
          continue;
        }
        if (raw.length !== width * height * channels) continue;

        try {
          const png = await sharp(raw, { raw: { width, height, channels } }).png().toBuffer();
          results.push({ pageIndex, data: png, format: "png", width, height });
        } catch {
          continue;
        }
      }
      // JPXDecode, CCITTFaxDecode, JBIG2Decode, chained filters — skip
    }
  }

  return results;
}
