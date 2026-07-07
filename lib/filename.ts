export function baseFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^./\\]+$/, "");
  const cleaned = withoutExt.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
  return cleaned || "document";
}
