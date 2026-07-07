// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import sharp from "sharp";
import { pdfToWord } from "@/lib/pdf/to-word";

async function makePdfWithText(lines: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([400, 400]);

  let y = 350;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 14, font });
    y -= 20;
  }

  return Buffer.from(await doc.save());
}

async function makePdfWithTextAndImage(text: string): Promise<Buffer> {
  const jpeg = await sharp({
    create: { width: 200, height: 150, channels: 3, background: { r: 10, g: 120, b: 200 } },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const image = await doc.embedJpg(jpeg);
  const page = doc.addPage([400, 400]);

  page.drawText(text, { x: 50, y: 350, size: 14, font });
  page.drawImage(image, { x: 50, y: 100, width: 200, height: 150 });

  return Buffer.from(await doc.save());
}

describe("pdfToWord", () => {
  it("produces a valid, non-empty .docx from a text PDF", async () => {
    const input = await makePdfWithText(["Hello world", "Second line of text"]);
    const output = await pdfToWord(input);

    expect(output.length).toBeGreaterThan(0);
    expect(output.subarray(0, 2).toString()).toBe("PK"); // .docx is a zip
  });

  it("embeds the extracted text in word/document.xml", async () => {
    const input = await makePdfWithText(["Unique Marker ABC123"]);
    const output = await pdfToWord(input);

    const zip = await JSZip.loadAsync(output);
    const documentXml = await zip.file("word/document.xml")?.async("string");

    expect(documentXml).toContain("Unique Marker ABC123");
  });

  it("still produces a valid docx for a PDF with no extractable text", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const input = Buffer.from(await doc.save());

    const output = await pdfToWord(input);
    expect(output.subarray(0, 2).toString()).toBe("PK");
  });

  it("embeds the page's images alongside its text in the docx media folder", async () => {
    const input = await makePdfWithTextAndImage("Caption above the image");
    const output = await pdfToWord(input);

    const zip = await JSZip.loadAsync(output);
    const mediaFiles = Object.keys(zip.files).filter((name) => name.startsWith("word/media/"));

    expect(mediaFiles.length).toBeGreaterThan(0);

    const documentXml = await zip.file("word/document.xml")?.async("string");
    expect(documentXml).toContain("Caption above the image");
    expect(documentXml).toContain("<w:drawing>");
  });
});
