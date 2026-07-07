import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFPageProxy } from "pdfjs-dist/types/src/display/api";
import { Document, Packer, Paragraph, TextRun, ImageRun, PageBreak } from "docx";
import { extractPdfImages, type ExtractedPdfImage } from "@/lib/pdf/extract-images";

const MAX_PAGES = 200;
const MAX_IMAGE_DISPLAY_WIDTH = 480; // keeps images within a typical page's content width

interface TextItem {
  str: string;
  hasEOL?: boolean;
}

async function extractPageParagraphs(page: PDFPageProxy): Promise<string[]> {
  const textContent = await page.getTextContent();
  const items = textContent.items as TextItem[];

  const paragraphs: string[] = [];
  let current = "";

  for (const item of items) {
    current += item.str;
    if (item.hasEOL) {
      paragraphs.push(current);
      current = "";
    } else if (item.str) {
      current += " ";
    }
  }
  if (current.trim()) paragraphs.push(current);

  return paragraphs.map((p) => p.trim()).filter(Boolean);
}

function scaledDimensions(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_IMAGE_DISPLAY_WIDTH) return { width, height };
  const scale = MAX_IMAGE_DISPLAY_WIDTH / width;
  return { width: MAX_IMAGE_DISPLAY_WIDTH, height: Math.round(height * scale) };
}

function groupImagesByPage(images: ExtractedPdfImage[]): Map<number, ExtractedPdfImage[]> {
  const map = new Map<number, ExtractedPdfImage[]>();
  for (const image of images) {
    const list = map.get(image.pageIndex) ?? [];
    list.push(image);
    map.set(image.pageIndex, list);
  }
  return map;
}

/**
 * Converts a PDF to a .docx by extracting each page's text (via pdfjs-dist)
 * and embedded images (via lib/pdf/extract-images.ts), writing both as plain
 * paragraphs — text first, then that page's images — via the docx library.
 * Like Word to PDF in reverse, this preserves content but not the original
 * layout: images are placed after their page's text rather than at their
 * exact original position, and fonts/tables aren't reconstructed. Real
 * page-faithful conversion needs a full layout engine.
 */
export async function pdfToWord(input: Buffer): Promise<Buffer> {
  const data = new Uint8Array(input);
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;

  if (doc.numPages > MAX_PAGES) {
    throw new Error(`This PDF has ${doc.numPages} pages. The limit for PDF to Word is ${MAX_PAGES}.`);
  }

  const imagesByPage = groupImagesByPage(await extractPdfImages(input));

  const children: Paragraph[] = [];
  let hasContent = false;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const pageParagraphs = await extractPageParagraphs(page);

    for (const text of pageParagraphs) {
      children.push(new Paragraph({ children: [new TextRun(text)] }));
      hasContent = true;
    }

    for (const image of imagesByPage.get(i - 1) ?? []) {
      const { width, height } = scaledDimensions(image.width, image.height);
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: image.format,
              data: image.data,
              transformation: { width, height },
            }),
          ],
        })
      );
      hasContent = true;
    }

    if (i < doc.numPages) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  if (!hasContent) {
    children.push(
      new Paragraph({
        children: [new TextRun("(This document appears to contain no extractable text or images.)")],
      })
    );
  }

  const wordDoc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(wordDoc);
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}
