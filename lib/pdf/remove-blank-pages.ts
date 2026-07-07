import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import type { RenderParameters } from "pdfjs-dist/types/src/display/api";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const RENDER_SCALE = 1; // a coarse render is enough for a blank-page check
// Deliberately tiny: a genuinely blank page renders at ~0% non-white, but even a single short
// line of real text can cover well under 0.1% of a page's pixels (thin glyphs, lots of page
// whitespace). This threshold only needs to catch "truly nothing was drawn," not "sparse."
const NON_WHITE_RATIO_THRESHOLD = 0.0003;
const NEAR_WHITE_CHANNEL_VALUE = 250; // per-channel value above which a pixel counts as "white"

export interface RemoveBlankPagesResult {
  buffer: Buffer;
  totalPages: number;
  /** 1-indexed page numbers that were dropped, for a human-readable report. */
  removedPageNumbers: number[];
}

async function computeNonWhiteRatio(pngBuffer: Buffer): Promise<number> {
  const { data, info } = await sharp(pngBuffer).raw().toBuffer({ resolveWithObject: true });
  let nonWhite = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    if (
      data[i] < NEAR_WHITE_CHANNEL_VALUE ||
      data[i + 1] < NEAR_WHITE_CHANNEL_VALUE ||
      data[i + 2] < NEAR_WHITE_CHANNEL_VALUE
    ) {
      nonWhite++;
    }
  }

  const totalPixels = data.length / info.channels;
  return totalPixels > 0 ? nonWhite / totalPixels : 0;
}

/**
 * Rasterizes each page (reusing the pdfjs-dist + @napi-rs/canvas pipeline from
 * lib/pdf/to-images.ts) and drops pages whose non-white pixel coverage falls
 * below a threshold. Never removes every page — if every page is judged
 * "blank" that's almost certainly a detection edge case, not real intent, so
 * the original document is returned unchanged in that case.
 */
export async function removeBlankPages(input: Buffer): Promise<RemoveBlankPagesResult> {
  const data = new Uint8Array(input);
  const pdfjsDoc = await pdfjsLib.getDocument({ data }).promise;

  const keepIndices: number[] = [];
  const removedPageNumbers: number[] = [];

  for (let i = 1; i <= pdfjsDoc.numPages; i++) {
    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    const renderParams = { canvasContext: context, viewport, canvas } as unknown as RenderParameters;
    await page.render(renderParams).promise;

    const ratio = await computeNonWhiteRatio(canvas.toBuffer("image/png"));

    if (ratio >= NON_WHITE_RATIO_THRESHOLD) {
      keepIndices.push(i - 1);
    } else {
      removedPageNumbers.push(i);
    }
  }

  const finalIndices =
    keepIndices.length > 0 ? keepIndices : Array.from({ length: pdfjsDoc.numPages }, (_, i) => i);

  const srcDoc = await PDFDocument.load(input);
  const outDoc = await PDFDocument.create();
  const copiedPages = await outDoc.copyPages(srcDoc, finalIndices);
  copiedPages.forEach((page) => outDoc.addPage(page));

  const bytes = await outDoc.save();

  return {
    buffer: Buffer.from(bytes),
    totalPages: pdfjsDoc.numPages,
    removedPageNumbers: keepIndices.length > 0 ? removedPageNumbers : [],
  };
}
