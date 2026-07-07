import { compressImageToTarget } from "@/lib/image/compress-to-target";
import { enhanceScan } from "@/lib/image/enhance-scan";
import { imagesToPdf } from "@/lib/image/to-pdf";
import { compressPdf } from "@/lib/pdf/compress";
import { removeBlankPages } from "@/lib/pdf/remove-blank-pages";
import type { DocumentSlot, ProcessedDocument } from "./types";

export interface SlotUpload {
  fileName: string;
  data: Buffer;
  mimeType: string;
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

function formatRange(slot: DocumentSlot): string {
  const min = slot.minSizeBytes ? formatKb(slot.minSizeBytes) : "0 KB";
  return `${min}-${formatKb(slot.maxSizeBytes)}`;
}

async function processPhotoOrSignature(
  upload: SlotUpload,
  slot: DocumentSlot,
  index: number
): Promise<ProcessedDocument> {
  const dims = slot.targetDimensions ?? { width: 200, height: 230 };
  const result = await compressImageToTarget(upload.data, {
    width: dims.width,
    height: dims.height,
    minSizeBytes: slot.minSizeBytes,
    maxSizeBytes: slot.maxSizeBytes,
  });

  const suffix = slot.multiple ? `-${index + 1}` : "";
  return {
    slotId: slot.id,
    fileName: `${slot.id}${suffix}.jpg`,
    data: result.data,
    sizeBytes: result.sizeBytes,
    meetsRequirement: result.meetsRequirement,
    note: result.meetsRequirement
      ? `${dims.width}x${dims.height}px, ${formatKb(result.sizeBytes)} — within requirement`
      : `${dims.width}x${dims.height}px, ${formatKb(result.sizeBytes)} — closest achievable to the ${formatRange(slot)} window`,
  };
}

async function processDocument(
  upload: SlotUpload,
  slot: DocumentSlot,
  index: number
): Promise<ProcessedDocument> {
  let pdfBuffer: Buffer;

  if (isImageMime(upload.mimeType)) {
    const enhanced = await enhanceScan(upload.data);
    pdfBuffer = await imagesToPdf([enhanced]);
  } else if (isPdfMime(upload.mimeType)) {
    pdfBuffer = upload.data;
  } else {
    throw new Error(`${upload.fileName}: unsupported file type for ${slot.label}.`);
  }

  const { buffer: dedupedBuffer, removedPageNumbers } = await removeBlankPages(pdfBuffer);
  pdfBuffer = dedupedBuffer;

  if (pdfBuffer.length > slot.maxSizeBytes) {
    const compressed = await compressPdf(pdfBuffer, { targetBytes: slot.maxSizeBytes });
    pdfBuffer = compressed.buffer;
  }

  const meets = pdfBuffer.length <= slot.maxSizeBytes;
  const suffix = slot.multiple ? `-${index + 1}` : "";
  const blankNote =
    removedPageNumbers.length > 0
      ? ` (removed ${removedPageNumbers.length} blank page${removedPageNumbers.length > 1 ? "s" : ""})`
      : "";

  return {
    slotId: slot.id,
    fileName: `${slot.id}${suffix}.pdf`,
    data: pdfBuffer,
    sizeBytes: pdfBuffer.length,
    meetsRequirement: meets,
    note: meets
      ? `${formatKb(pdfBuffer.length)}, within the ${formatKb(slot.maxSizeBytes)} limit${blankNote}`
      : `${formatKb(pdfBuffer.length)} — still over the ${formatKb(slot.maxSizeBytes)} limit after compression${blankNote}`,
  };
}

export async function processSlotUpload(
  upload: SlotUpload,
  slot: DocumentSlot,
  index: number
): Promise<ProcessedDocument> {
  if (slot.kind === "photo" || slot.kind === "signature") {
    return processPhotoOrSignature(upload, slot, index);
  }
  return processDocument(upload, slot, index);
}
