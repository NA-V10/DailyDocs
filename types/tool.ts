import type { LucideIcon } from "lucide-react";

export type ToolCategory = "pdf" | "image" | "text" | "qr" | "files";

export interface ToolConfig {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  /** Accepted file extensions, e.g. [".pdf"] */
  accept: string[];
  /** Accepted MIME types for validation */
  acceptMime: string[];
  maxFiles: number;
  maxFileSizeBytes: number;
  /** Whether this tool has a working implementation yet */
  available: boolean;
}

export type ToolProcessingState =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

export interface ToolHistoryEntry {
  tool: string;
  toolName: string;
  fileName: string;
  timestamp: number;
}
