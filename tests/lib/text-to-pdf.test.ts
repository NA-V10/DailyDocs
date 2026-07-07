// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { textToPdf } from "@/lib/text/text-to-pdf";

describe("textToPdf", () => {
  it("produces a valid single-page PDF for short text", async () => {
    const output = await textToPdf("Hello world.\n\nA second paragraph.");
    const doc = await PDFDocument.load(output);

    expect(doc.getPageCount()).toBe(1);
  });

  it("paginates long text across multiple pages", async () => {
    const longText = Array.from({ length: 150 }, (_, i) => `Line number ${i} of a long document.`).join(
      "\n"
    );
    const output = await textToPdf(longText);
    const doc = await PDFDocument.load(output);

    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("produces a valid PDF even for empty-ish input", async () => {
    const output = await textToPdf("   \n\n  ");
    const doc = await PDFDocument.load(output);

    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("rejects text over the length limit", async () => {
    const tooLong = "a".repeat(200_001);
    await expect(textToPdf(tooLong)).rejects.toThrow();
  });
});
