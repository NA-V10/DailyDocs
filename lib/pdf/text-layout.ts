import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_HEIGHT = FONT_SIZE * 1.4;
const PARAGRAPH_SPACING = LINE_HEIGHT * 0.6;
const MAX_TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function wrapLine(text: string, font: PDFFont): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, FONT_SIZE) > MAX_TEXT_WIDTH) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  return lines;
}

/**
 * Flows plain-text paragraphs onto paginated A4 pages (wrapping lines to fit,
 * adding new pages as content overflows). Shared by Word to PDF (paragraphs
 * come from mammoth's extracted text) and Text to PDF (paragraphs come
 * straight from the user's textarea) so both get identical, tested pagination
 * behavior instead of two copies of the same layout code.
 */
export async function flowTextToPdf(paragraphs: string[], emptyMessage: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function ensureSpace() {
    if (y < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function drawLine(text: string) {
    ensureSpace();
    page.drawText(text, { x: MARGIN, y, size: FONT_SIZE, font, color: rgb(0, 0, 0) });
    y -= LINE_HEIGHT;
  }

  let hasContent = false;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      y -= PARAGRAPH_SPACING;
      continue;
    }

    hasContent = true;
    for (const line of wrapLine(trimmed, font)) {
      drawLine(line);
    }
    y -= PARAGRAPH_SPACING;
  }

  if (!hasContent) {
    drawLine(emptyMessage);
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
