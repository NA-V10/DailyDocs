import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import type { RenderParameters } from "pdfjs-dist/types/src/display/api";

const MAX_PAGES = 60;
const DEFAULT_SCALE = 2; // ~144 DPI, a good balance of clarity and file size

export interface PdfToImagesResult {
  name: string;
  data: Buffer;
}

export async function pdfToImages(
  input: Buffer,
  baseName: string,
  scale: number = DEFAULT_SCALE
): Promise<PdfToImagesResult[]> {
  const data = new Uint8Array(input);
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;

  if (doc.numPages > MAX_PAGES) {
    throw new Error(`This PDF has ${doc.numPages} pages. The limit for PDF to Images is ${MAX_PAGES}.`);
  }

  const results: PdfToImagesResult[] = [];
  const pad = String(doc.numPages).length;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    const renderParams = { canvasContext: context, viewport, canvas } as unknown as RenderParameters;
    await page.render(renderParams).promise;

    const pageNumber = String(i).padStart(pad, "0");
    results.push({
      name: `${baseName}-page-${pageNumber}.png`,
      data: canvas.toBuffer("image/png"),
    });
  }

  return results;
}
