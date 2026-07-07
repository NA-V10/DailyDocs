import { NextRequest } from "next/server";
import { buildRenamedFiles, type RenamePatternOptions } from "@/lib/files/batch-rename";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { createZip } from "@/lib/zip";

export const runtime = "nodejs";

const VALID_SEPARATORS = ["-", "_", " ", ""];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return errorResponse("Select at least one file to rename.");
    }

    const baseName = formData.get("baseName");
    const startNumberRaw = formData.get("startNumber");
    const paddingRaw = formData.get("padding");
    const separator = formData.get("separator");

    if (typeof baseName !== "string" || baseName.trim().length === 0) {
      return errorResponse("Enter a base name.");
    }
    if (typeof separator !== "string" || !VALID_SEPARATORS.includes(separator)) {
      return errorResponse("Choose a valid separator.");
    }

    const startNumber = Number(startNumberRaw);
    const padding = Number(paddingRaw);
    if (!Number.isInteger(startNumber) || startNumber < 0) {
      return errorResponse("Enter a valid starting number.");
    }
    if (!Number.isInteger(padding) || padding < 0 || padding > 6) {
      return errorResponse("Enter a valid padding amount (0-6).");
    }

    const options: RenamePatternOptions = { baseName, startNumber, padding, separator };

    const fileBuffers = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        data: Buffer.from(await file.arrayBuffer()),
      }))
    );

    const renamed = buildRenamedFiles(fileBuffers, options);

    if (renamed.length === 1) {
      return fileResponse(renamed[0].data, renamed[0].name, "application/octet-stream");
    }

    const zipBuffer = await createZip(renamed);
    return fileResponse(zipBuffer, "renamed-files.zip", "application/zip");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to rename files.",
      500
    );
  }
}
