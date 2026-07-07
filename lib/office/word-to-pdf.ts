import mammoth from "mammoth";
import { flowTextToPdf } from "@/lib/pdf/text-layout";

/**
 * Converts a .docx file to a paginated PDF by extracting its plain text and
 * flowing it onto A4 pages. This is not a pixel-perfect layout conversion —
 * mammoth's extractRawText discards formatting, tables, and images — but it
 * faithfully reproduces the document's text content, which covers the common
 * "convert my resume/assignment/form to PDF" use case without needing a
 * headless-browser or LibreOffice dependency.
 */
export async function wordToPdf(input: Buffer): Promise<Buffer> {
  const { value: rawText } = await mammoth.extractRawText({ buffer: input });
  const paragraphs = rawText.split(/\r?\n/);
  return flowTextToPdf(paragraphs, "(This document appears to be empty.)");
}
