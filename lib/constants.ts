export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
export const MAX_FILES_DEFAULT = 1;
export const MAX_FILES_MULTI = 20;
export const MAX_FILES_BATCH_RENAME = 50;

export const RENAME_SEPARATORS = [
  { value: "-", label: "Dash (-)" },
  { value: "_", label: "Underscore (_)" },
  { value: " ", label: "Space" },
  { value: "", label: "None" },
] as const;

export const TOOL_HISTORY_STORAGE_KEY = "dailydocs:recent-history";
export const TOOL_HISTORY_MAX_ENTRIES = 20;

export interface CompressionTarget {
  id: string;
  label: string;
  bytes: number | null;
}

export const COMPRESSION_TARGETS: CompressionTarget[] = [
  { id: "best", label: "Best quality", bytes: null },
  { id: "100kb", label: "Under 100 KB", bytes: 100 * 1024 },
  { id: "200kb", label: "Under 200 KB", bytes: 200 * 1024 },
  { id: "500kb", label: "Under 500 KB", bytes: 500 * 1024 },
  { id: "1mb", label: "Under 1 MB", bytes: 1024 * 1024 },
];

export function getCompressionTarget(id: string): CompressionTarget {
  return COMPRESSION_TARGETS.find((target) => target.id === id) ?? COMPRESSION_TARGETS[0];
}
