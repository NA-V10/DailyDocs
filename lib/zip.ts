import JSZip from "jszip";

export interface ZipEntry {
  name: string;
  data: Buffer;
}

export async function createZip(files: ZipEntry[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.data);
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer;
}
