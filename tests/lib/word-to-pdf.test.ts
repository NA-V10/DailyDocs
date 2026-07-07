// @vitest-environment node
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { wordToPdf } from "@/lib/office/word-to-pdf";

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const PACKAGE_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

/** Builds a minimal-but-valid .docx buffer (no external fixture needed). */
async function makeMinimalDocx(paragraphs: string[]): Promise<Buffer> {
  const body = paragraphs
    .map((text) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`)
    .join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}</w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.file("_rels/.rels", PACKAGE_RELS_XML);
  zip.file("word/document.xml", documentXml);
  zip.file("word/_rels/document.xml.rels", DOCUMENT_RELS_XML);

  return zip.generateAsync({ type: "nodebuffer" });
}

describe("wordToPdf", () => {
  it("converts paragraph text into a valid, non-empty PDF", async () => {
    const docx = await makeMinimalDocx([
      "This is the first paragraph of the document.",
      "This is a second, separate paragraph.",
    ]);

    const output = await wordToPdf(docx);
    const doc = await PDFDocument.load(output);

    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(output.length).toBeGreaterThan(0);
  });

  it("paginates long content across multiple pages", async () => {
    const longParagraphs = Array.from(
      { length: 120 },
      (_, i) => `Line number ${i} of a very long document that should overflow one page.`
    );
    const docx = await makeMinimalDocx(longParagraphs);

    const output = await wordToPdf(docx);
    const doc = await PDFDocument.load(output);

    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("still produces a valid PDF for an empty document", async () => {
    const docx = await makeMinimalDocx([]);

    const output = await wordToPdf(docx);
    const doc = await PDFDocument.load(output);

    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
