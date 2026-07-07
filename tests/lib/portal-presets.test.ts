// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PORTAL_PRESETS, getPortalPreset } from "@/lib/portal-presets/presets-config";
import { processSlotUpload } from "@/lib/portal-presets/process-package";
import type { DocumentSlot } from "@/lib/portal-presets/types";

describe("PORTAL_PRESETS data", () => {
  it("has a unique slug per preset", () => {
    const slugs = PORTAL_PRESETS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every non-custom preset at least one photo/signature slot with real numbers", () => {
    for (const preset of PORTAL_PRESETS) {
      if (preset.isCustom) continue;
      const idSlots = preset.slots.filter((s) => s.kind === "photo" || s.kind === "signature");
      expect(idSlots.length).toBeGreaterThan(0);
      for (const slot of idSlots) {
        expect(slot.maxSizeBytes).toBeGreaterThan(0);
        expect(slot.targetDimensions?.width).toBeGreaterThan(0);
        expect(slot.targetDimensions?.height).toBeGreaterThan(0);
      }
      expect(preset.sources.length).toBeGreaterThan(0);
    }
  });

  it("looks up known and unknown slugs correctly", () => {
    expect(getPortalPreset("passport-seva")?.name).toBe("Passport Seva");
    expect(getPortalPreset("not-a-real-portal")).toBeUndefined();
  });
});

async function makeNoisyJpeg(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 180, g: 180, b: 180 },
      noise: { type: "gaussian", mean: 150, sigma: 50 },
    },
  })
    .jpeg({ quality: 100 })
    .toBuffer();
}

const PHOTO_SLOT: DocumentSlot = {
  id: "photo",
  label: "Photo",
  helpText: "",
  kind: "photo",
  required: true,
  multiple: false,
  targetFormat: "jpeg",
  targetDimensions: { width: 200, height: 230 },
  minSizeBytes: 20 * 1024,
  maxSizeBytes: 50 * 1024,
};

const DOCUMENT_SLOT: DocumentSlot = {
  id: "addressProof",
  label: "Address proof",
  helpText: "",
  kind: "document",
  required: false,
  multiple: false,
  targetFormat: "pdf",
  maxSizeBytes: 500 * 1024,
};

describe("processSlotUpload — photo/signature slots", () => {
  it("resizes and compresses a photo to the slot's requirement", async () => {
    const upload = { fileName: "me.jpg", data: await makeNoisyJpeg(1200, 1600), mimeType: "image/jpeg" };
    const result = await processSlotUpload(upload, PHOTO_SLOT, 0);

    expect(result.fileName).toBe("photo.jpg");
    expect(result.meetsRequirement).toBe(true);

    const metadata = await sharp(result.data).metadata();
    expect(metadata.width).toBe(200);
    expect(metadata.height).toBe(230);
  });
});

describe("processSlotUpload — document slots", () => {
  it("converts an image upload into a PDF", async () => {
    const upload = {
      fileName: "proof.jpg",
      data: await makeNoisyJpeg(800, 1000),
      mimeType: "image/jpeg",
    };
    const result = await processSlotUpload(upload, DOCUMENT_SLOT, 0);

    expect(result.fileName).toBe("addressProof.pdf");
    const doc = await PDFDocument.load(result.data);
    expect(doc.getPageCount()).toBe(1);
  });

  it("removes blank pages from an uploaded PDF", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    src.addPage([200, 200]); // blank
    const contentPage = src.addPage([200, 200]);
    contentPage.drawText("Content", { x: 30, y: 100, size: 16, font, color: rgb(0, 0, 0) });
    const inputPdf = Buffer.from(await src.save());

    const upload = { fileName: "doc.pdf", data: inputPdf, mimeType: "application/pdf" };
    const result = await processSlotUpload(upload, DOCUMENT_SLOT, 0);

    const outDoc = await PDFDocument.load(result.data);
    expect(outDoc.getPageCount()).toBe(1);
    expect(result.note).toContain("removed 1 blank page");
  });

  it("compresses a PDF that exceeds the slot's max size", async () => {
    const jpeg = await sharp({
      create: {
        width: 1600,
        height: 1200,
        channels: 3,
        background: { r: 180, g: 180, b: 180 },
        noise: { type: "gaussian", mean: 150, sigma: 60 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const doc = await PDFDocument.create();
    const image = await doc.embedJpg(jpeg);
    const page = doc.addPage([1600, 1200]);
    page.drawImage(image, { x: 0, y: 0, width: 1600, height: 1200 });
    const inputPdf = Buffer.from(await doc.save());

    const smallSlot: DocumentSlot = { ...DOCUMENT_SLOT, maxSizeBytes: 100 * 1024 };
    const upload = { fileName: "big.pdf", data: inputPdf, mimeType: "application/pdf" };
    const result = await processSlotUpload(upload, smallSlot, 0);

    expect(result.data.length).toBeLessThan(inputPdf.length);
    expect(result.data.length).toBeLessThanOrEqual(smallSlot.maxSizeBytes * 1.05); // allow tiny slack
  });
});
