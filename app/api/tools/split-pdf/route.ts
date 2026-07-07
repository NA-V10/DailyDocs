import { NextRequest } from "next/server";
import { splitPdfAllPages, splitPdfByRanges } from "@/lib/pdf/split";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { baseFileName } from "@/lib/filename";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";
import { createZip } from "@/lib/zip";

export const runtime = "nodejs";

const tool = getToolBySlug("split-pdf")!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = formData.get("mode");
    const ranges = formData.get("ranges");

    if (!(file instanceof File)) {
      return errorResponse("No file was uploaded.");
    }

    const validation = validateFile(file, tool);
    if (!validation.valid) {
      return errorResponse(validation.error ?? "Invalid file.");
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const name = baseFileName(file.name);

    const results =
      mode === "ranges"
        ? await splitPdfByRanges(inputBuffer, typeof ranges === "string" ? ranges : "", name)
        : await splitPdfAllPages(inputBuffer, name);

    if (results.length === 1) {
      return fileResponse(results[0].data, results[0].name, "application/pdf");
    }

    const zipBuffer = await createZip(results);
    return fileResponse(zipBuffer, `${name}-split.zip`, "application/zip");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to split PDF.",
      500
    );
  }
}
