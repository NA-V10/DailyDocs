export interface RenamePatternOptions {
  baseName: string;
  startNumber: number;
  padding: number;
  separator: string;
}

export interface FileLike {
  name: string;
  data: Buffer;
}

export interface RenamedFile {
  name: string;
  data: Buffer;
}

export function sanitizeBaseName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
  return cleaned || "file";
}

function getExtension(fileName: string): string {
  const match = fileName.match(/\.[^./\\]+$/);
  return match ? match[0] : "";
}

/** Pure naming logic — safe to reuse client-side for a live filename preview. */
export function buildFileName(
  originalName: string,
  index: number,
  options: RenamePatternOptions
): string {
  const number = options.startNumber + index;
  const numberStr = options.padding > 0 ? String(number).padStart(options.padding, "0") : String(number);
  const baseName = sanitizeBaseName(options.baseName);
  const ext = getExtension(originalName);
  return `${baseName}${options.separator}${numberStr}${ext}`;
}

export function buildRenamedFiles(
  files: FileLike[],
  options: RenamePatternOptions
): RenamedFile[] {
  return files.map((file, index) => ({
    name: buildFileName(file.name, index, options),
    data: file.data,
  }));
}
