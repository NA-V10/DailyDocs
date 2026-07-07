import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

export interface FileValidationOptions {
  acceptMime: string[];
  accept: string[];
  maxFileSizeBytes?: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

function hasAcceptedExtension(fileName: string, accept: string[]): boolean {
  const lower = fileName.toLowerCase();
  return accept.some((ext) => lower.endsWith(ext.toLowerCase()));
}

export function validateFile(
  file: { name: string; size: number; type: string },
  options: FileValidationOptions
): FileValidationResult {
  const maxSize = options.maxFileSizeBytes ?? MAX_FILE_SIZE_BYTES;

  if (file.size <= 0) {
    return { valid: false, error: "The selected file is empty." };
  }

  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File is too large. Maximum size is ${maxMb}MB.` };
  }

  // Both lists empty means "no restriction" (e.g. Batch Rename accepts any file type),
  // not "reject everything" — tools that do restrict always specify at least one list.
  const noRestriction = options.accept.length === 0 && options.acceptMime.length === 0;
  const typeMatches = options.acceptMime.includes(file.type);
  const extensionMatches = hasAcceptedExtension(file.name, options.accept);

  if (!noRestriction && !typeMatches && !extensionMatches) {
    return {
      valid: false,
      error: `Unsupported file type. Accepted formats: ${options.accept.join(", ")}.`,
    };
  }

  return { valid: true };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  const rounded = Math.round(value * 10) / 10;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${formatted} ${units[exponent]}`;
}
