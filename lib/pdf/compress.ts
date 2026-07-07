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

type SharpInstance = ReturnType<typeof sharp>;

export interface CompressPdfOptions {
  /** Try to get the output under this many bytes. Omit for a single "best quality" pass. */
  targetBytes?: number | null;
}

export interface CompressPdfResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  /** true = hit the target, false = couldn't, null = no target was requested */
  targetMet: boolean | null;
}

interface RecompressSettings {
  quality: number;
  maxDimension: number;
}

// From mild (near-lossless) to aggressive. Each attempt re-runs from the original
// input — JPEG quality loss doesn't compound well, so we don't chain attempts.
const ATTEMPT_LADDER: RecompressSettings[] = [
  { quality: 85, maxDimension: 2200 },
  { quality: 70, maxDimension: 1800 },
  { quality: 55, maxDimension: 1500 },
  { quality: 45, maxDimension: 1200 },
  { quality: 35, maxDimension: 1000 },
  { quality: 25, maxDimension: 800 },
  { quality: 15, maxDimension: 650 },
];

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
 * Recompresses embedded raster images in place: decodes each Image XObject,
 * re-encodes it as a JPEG at the given quality/resolution via sharp, and swaps
 * the XObject reference. pdf-lib does not garbage-collect unreferenced objects
 * on save, so the orphaned original image streams are explicitly deleted —
 * otherwise their bytes would remain in the output file, undoing the savings.
 *
 * Only handles the two common cases: images already stored as JPEG (DCTDecode —
 * the vast majority of scanned/photographed PDF pages), and simple 8-bit
 * Gray/RGB raw or FlateDecode samples with no PNG/TIFF predictor. Anything else
 * (1-bit scans, indexed palettes, CMYK raw samples, JPEG2000, chained filters,
 * images with a soft mask) is left untouched rather than risk corrupting it.
 */
async function recompressImages(input: Buffer, settings: RecompressSettings): Promise<Buffer> {
  const doc = await PDFDocument.load(input, { updateMetadata: false });
  const context = doc.context;

  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("");
  doc.setCreator("");

  const processedRefs = new Map<number, PDFRef>();
  const staleRefs: PDFRef[] = [];

  for (const page of doc.getPages()) {
    const resources = page.node.Resources();
    if (!resources) continue;

    const xObjects = resolveMaybe(context, resources.get(PDFName.of("XObject")));
    if (!(xObjects instanceof PDFDict)) continue;

    for (const [name, value] of xObjects.entries()) {
      if (!(value instanceof PDFRef)) continue;
      const ref = value;

      const cached = processedRefs.get(ref.objectNumber);
      if (cached) {
        xObjects.set(name, cached);
        continue;
      }

      const streamObj = context.lookupMaybe(ref, PDFStream);
      if (!(streamObj instanceof PDFRawStream)) continue;
      const stream = streamObj;

      const dict = stream.dict;
      const subtype = resolveMaybe(context, dict.get(PDFName.of("Subtype")));
      if (subtype !== IMAGE_SUBTYPE) continue;

      // Skip transparent images — flattening to opaque JPEG would visibly change them.
      if (dict.get(PDFName.of("SMask")) || dict.get(PDFName.of("Mask"))) continue;

      const bpcObj = resolveMaybe(context, dict.get(PDFName.of("BitsPerComponent")));
      if (!(bpcObj instanceof PDFNumber) || bpcObj.asNumber() !== 8) continue;

      const widthObj = resolveMaybe(context, dict.get(PDFName.of("Width")));
      const heightObj = resolveMaybe(context, dict.get(PDFName.of("Height")));
      if (!(widthObj instanceof PDFNumber) || !(heightObj instanceof PDFNumber)) continue;
      const width = widthObj.asNumber();
      const height = heightObj.asNumber();

      const filterObj = resolveMaybe(context, dict.get(PDFName.of("Filter")));

      let sharpInput: SharpInstance;

      if (filterObj === DCT_DECODE) {
        try {
          sharpInput = sharp(Buffer.from(stream.contents));
        } catch {
          continue;
        }
      } else if (filterObj === FLATE_DECODE || filterObj === undefined) {
        const decodeParms = resolveMaybe(context, dict.get(PDFName.of("DecodeParms")));
        if (decodeParms instanceof PDFDict) {
          const predictor = resolveMaybe(context, decodeParms.get(PDFName.of("Predictor")));
          if (predictor instanceof PDFNumber && predictor.asNumber() > 1) continue; // PNG/TIFF predictor, not plain samples
        }

        const colorSpaceObj = resolveMaybe(context, dict.get(PDFName.of("ColorSpace")));
        const channels: 1 | 3 | undefined =
          colorSpaceObj === DEVICE_GRAY ? 1 : colorSpaceObj === DEVICE_RGB ? 3 : undefined;
        if (!channels) continue; // CMYK/Indexed/ICCBased raw samples — too risky to guess

        let raw: Buffer;
        try {
          raw =
            filterObj === FLATE_DECODE
              ? inflateSync(Buffer.from(stream.contents))
              : Buffer.from(stream.contents);
        } catch {
          continue;
        }

        if (raw.length !== width * height * channels) continue; // unexpected layout, skip safely

        try {
          sharpInput = sharp(raw, { raw: { width, height, channels } });
        } catch {
          continue;
        }
      } else {
        continue; // JPXDecode, CCITTFaxDecode, JBIG2Decode, chained filters — leave untouched
      }

      let newImageBytes: Buffer;
      try {
        newImageBytes = await sharpInput
          .rotate()
          .resize({
            width: settings.maxDimension,
            height: settings.maxDimension,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: settings.quality })
          .toBuffer();
      } catch {
        continue;
      }

      if (newImageBytes.length >= stream.contents.length) continue; // not actually smaller, keep original

      const newImage = await doc.embedJpg(newImageBytes);
      xObjects.set(name, newImage.ref);
      processedRefs.set(ref.objectNumber, newImage.ref);
      staleRefs.push(ref);
    }
  }

  for (const ref of staleRefs) {
    context.delete(ref);
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return Buffer.from(bytes);
}

export async function compressPdf(
  input: Buffer,
  options: CompressPdfOptions = {}
): Promise<CompressPdfResult> {
  const targetBytes = options.targetBytes ?? null;
  const originalSize = input.length;

  if (!targetBytes) {
    const buffer = await recompressImages(input, { quality: 80, maxDimension: 2000 });
    return { buffer, originalSize, compressedSize: buffer.length, targetMet: null };
  }

  let best: Buffer | null = null;

  for (const attempt of ATTEMPT_LADDER) {
    const candidate = await recompressImages(input, attempt);
    if (!best || candidate.length < best.length) best = candidate;
    if (candidate.length <= targetBytes) {
      return { buffer: candidate, originalSize, compressedSize: candidate.length, targetMet: true };
    }
  }

  const finalBuffer = best ?? input;
  return {
    buffer: finalBuffer,
    originalSize,
    compressedSize: finalBuffer.length,
    targetMet: finalBuffer.length <= targetBytes,
  };
}
