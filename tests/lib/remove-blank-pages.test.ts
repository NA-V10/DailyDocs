// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { removeBlankPages } from "@/lib/pdf/remove-blank-pages";

async function makeMixedPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  doc.addPage([200, 200]); // page 1: blank

  const page2 = doc.addPage([200, 200]); // page 2: has content
  page2.drawRectangle({ x: 20, y: 20, width: 160, height: 160, color: rgb(0, 0, 0) });

  doc.addPage([200, 200]); // page 3: blank

  const page4 = doc.addPage([200, 200]); // page 4: has content
  page4.drawText("Hello", { x: 50, y: 100, size: 20, font, color: rgb(0, 0, 0) });

  return Buffer.from(await doc.save());
}

describe("removeBlankPages", () => {
  it("removes blank pages and keeps pages with content, in order", async () => {
    const input = await makeMixedPdf();
    const result = await removeBlankPages(input);

    expect(result.totalPages).toBe(4);
    expect(result.removedPageNumbers).toEqual([1, 3]);

    const outDoc = await PDFDocument.load(result.buffer);
    expect(outDoc.getPageCount()).toBe(2);
  });

  it("keeps all pages if none are blank", async () => {
    const doc = await PDFDocument.create();
    const p1 = doc.addPage([200, 200]);
    p1.drawRectangle({ x: 0, y: 0, width: 200, height: 200, color: rgb(0, 0, 0) });
    const p2 = doc.addPage([200, 200]);
    p2.drawRectangle({ x: 0, y: 0, width: 200, height: 200, color: rgb(0.2, 0.2, 0.2) });
    const input = Buffer.from(await doc.save());

    const result = await removeBlankPages(input);
    expect(result.removedPageNumbers).toEqual([]);

    const outDoc = await PDFDocument.load(result.buffer);
    expect(outDoc.getPageCount()).toBe(2);
  });

  it("does not remove every page even if all render as blank", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    doc.addPage([200, 200]);
    const input = Buffer.from(await doc.save());

    const result = await removeBlankPages(input);
    const outDoc = await PDFDocument.load(result.buffer);
    expect(outDoc.getPageCount()).toBe(2); // falls back to keeping everything
  });
});
