// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument, degrees } from "pdf-lib";
import { rotatePdf } from "@/lib/pdf/rotate";

async function makePdf(pageCount: number, initialRotation = 0): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([200, 300]);
    if (initialRotation) page.setRotation(degrees(initialRotation));
  }
  return Buffer.from(await doc.save());
}

describe("rotatePdf", () => {
  it("rotates all pages clockwise by 90 degrees", async () => {
    const input = await makePdf(3);
    const output = await rotatePdf(input, "clockwise");
    const doc = await PDFDocument.load(output);
    for (const page of doc.getPages()) {
      expect(page.getRotation().angle).toBe(90);
    }
  });

  it("rotates counter-clockwise, wrapping to 270", async () => {
    const input = await makePdf(1);
    const output = await rotatePdf(input, "counterclockwise");
    const doc = await PDFDocument.load(output);
    expect(doc.getPage(0).getRotation().angle).toBe(270);
  });

  it("rotates 180 degrees", async () => {
    const input = await makePdf(1);
    const output = await rotatePdf(input, "180");
    const doc = await PDFDocument.load(output);
    expect(doc.getPage(0).getRotation().angle).toBe(180);
  });

  it("accumulates on top of an existing rotation", async () => {
    const input = await makePdf(1, 90);
    const output = await rotatePdf(input, "clockwise");
    const doc = await PDFDocument.load(output);
    expect(doc.getPage(0).getRotation().angle).toBe(180);
  });
});
