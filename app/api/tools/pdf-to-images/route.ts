import { NextRequest } from "next/server";
import { pdfToImages } from "@/lib/pdf/to-images";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { baseFileName } from "@/lib/filename";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";
import { createZip } from "@/lib/zip";

export const runtime = "nodejs";

const tool = getToolBySlug("pdf-to-images")!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("No file was uploaded.");
    }

    const validation = validateFile(file, tool);
    if (!validation.valid) {
      return errorResponse(validation.error ?? "Invalid file.");
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const name = baseFileName(file.name);
    const results = await pdfToImages(inputBuffer, name);

    if (results.length === 1) {
      return fileResponse(results[0].data, results[0].name, "image/png");
    }

    const zipBuffer = await createZip(results);
    return fileResponse(zipBuffer, `${name}-images.zip`, "application/zip");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to convert PDF to images.",
      500
    );
  }
}
