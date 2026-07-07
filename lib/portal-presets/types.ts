export type DocumentSlotKind = "photo" | "signature" | "document";

export interface DocumentSlot {
  id: string;
  label: string;
  helpText: string;
  kind: DocumentSlotKind;
  required: boolean;
  multiple: boolean;
  targetFormat: "jpeg" | "pdf";
  /** Pixel dimensions to resize/crop to. Only meaningful for photo/signature slots. */
  targetDimensions?: { width: number; height: number };
  minSizeBytes?: number;
  maxSizeBytes: number;
}

export interface PresetSource {
  label: string;
  url: string;
}

export interface PortalPreset {
  slug: string;
  name: string;
  agency: string;
  description: string;
  slots: DocumentSlot[];
  sources: PresetSource[];
  /** e.g. "2026-07" — surfaced in the UI so staleness is visible. */
  lastVerified: string;
  /** True for the one preset where the user supplies their own numbers instead of a fixed spec. */
  isCustom?: boolean;
}

export interface ProcessedDocument {
  slotId: string;
  fileName: string;
  data: Buffer;
  sizeBytes: number;
  meetsRequirement: boolean;
  note: string;
}
