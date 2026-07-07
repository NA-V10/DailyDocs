import { PDFDocument } from "pdf-lib";

export interface SplitResultFile {
  name: string;
  data: Buffer;
}

export async function splitPdfAllPages(
  input: Buffer,
  baseName: string
): Promise<SplitResultFile[]> {
  const src = await PDFDocument.load(input);
  const pageCount = src.getPageCount();
  const results: SplitResultFile[] = [];

  for (let i = 0; i < pageCount; i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    const bytes = await doc.save();
    results.push({ name: `${baseName}-page-${i + 1}.pdf`, data: Buffer.from(bytes) });
  }

  return results;
}

/** Parses "1-3,5,7-9" into zero-indexed page groups, one group per output file. */
export function parsePageRanges(rangesInput: string, pageCount: number): number[][] {
  const ranges = rangesInput
    .split(",")
    .map((range) => range.trim())
    .filter(Boolean);

  if (ranges.length === 0) {
    throw new Error("Enter at least one page range, e.g. 1-3 or 5.");
  }

  return ranges.map((range) => {
    const match = range.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new Error(`Invalid page range: "${range}".`);
    }

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;

    if (start < 1 || end < start || end > pageCount) {
      throw new Error(
        `Page range "${range}" is out of bounds (document has ${pageCount} pages).`
      );
    }

    const indices: number[] = [];
    for (let i = start; i <= end; i++) indices.push(i - 1);
    return indices;
  });
}

export async function splitPdfByRanges(
  input: Buffer,
  rangesInput: string,
  baseName: string
): Promise<SplitResultFile[]> {
  const src = await PDFDocument.load(input);
  const pageCount = src.getPageCount();
  const rangeGroups = parsePageRanges(rangesInput, pageCount);
  const results: SplitResultFile[] = [];

  for (let i = 0; i < rangeGroups.length; i++) {
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, rangeGroups[i]);
    pages.forEach((page) => doc.addPage(page));
    const bytes = await doc.save();
    results.push({ name: `${baseName}-part-${i + 1}.pdf`, data: Buffer.from(bytes) });
  }

  return results;
}
