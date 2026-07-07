// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergePdfs } from "@/lib/pdf/merge";
import { splitPdfAllPages, splitPdfByRanges, parsePageRanges } from "@/lib/pdf/split";

async function makePdf(pageCount: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([200, 200]);
  }
  return Buffer.from(await doc.save());
}

describe("mergePdfs", () => {
  it("combines page counts from all inputs", async () => {
    const a = await makePdf(2);
    const b = await makePdf(3);
    const merged = await mergePdfs([a, b]);
    const doc = await PDFDocument.load(merged);
    expect(doc.getPageCount()).toBe(5);
  });

  it("throws when fewer than two files are provided", async () => {
    const a = await makePdf(1);
    await expect(mergePdfs([a])).rejects.toThrow();
  });
});

describe("parsePageRanges", () => {
  it("parses simple ranges and single pages", () => {
    expect(parsePageRanges("1-2,4", 5)).toEqual([[0, 1], [3]]);
  });

  it("throws for out-of-bounds ranges", () => {
    expect(() => parsePageRanges("1-10", 5)).toThrow();
  });

  it("throws for invalid syntax", () => {
    expect(() => parsePageRanges("abc", 5)).toThrow();
  });
});

describe("splitPdfAllPages", () => {
  it("produces one file per page", async () => {
    const input = await makePdf(4);
    const results = await splitPdfAllPages(input, "doc");
    expect(results).toHaveLength(4);
    expect(results[0].name).toBe("doc-page-1.pdf");
  });
});

describe("splitPdfByRanges", () => {
  it("produces one file per range group", async () => {
    const input = await makePdf(6);
    const results = await splitPdfByRanges(input, "1-2,4-6", "doc");
    expect(results).toHaveLength(2);

    const first = await PDFDocument.load(results[0].data);
    const second = await PDFDocument.load(results[1].data);
    expect(first.getPageCount()).toBe(2);
    expect(second.getPageCount()).toBe(3);
  });
});
