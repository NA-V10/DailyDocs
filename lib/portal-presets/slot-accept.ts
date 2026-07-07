import type { DocumentSlot } from "./types";

export const PHOTO_ACCEPT = [".jpg", ".jpeg", ".png", ".webp"];
export const PHOTO_ACCEPT_MIME = ["image/jpeg", "image/png", "image/webp"];
export const DOCUMENT_ACCEPT = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
export const DOCUMENT_ACCEPT_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function acceptForSlot(slot: DocumentSlot): string[] {
  return slot.kind === "document" ? DOCUMENT_ACCEPT : PHOTO_ACCEPT;
}

export function acceptMimeForSlot(slot: DocumentSlot): string[] {
  return slot.kind === "document" ? DOCUMENT_ACCEPT_MIME : PHOTO_ACCEPT_MIME;
}
