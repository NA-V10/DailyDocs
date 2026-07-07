import { NextRequest } from "next/server";
import { imagesToPdf } from "@/lib/image/to-pdf";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";

export const runtime = "nodejs";

const tool = getToolBySlug("image-to-pdf")!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return errorResponse("Select at least one image.");
    }

    for (const file of files) {
      const validation = validateFile(file, tool);
      if (!validation.valid) {
        return errorResponse(`${file.name}: ${validation.error}`);
      }
    }

    const buffers = await Promise.all(
      files.map(async (file) => Buffer.from(await file.arrayBuffer()))
    );
    const outputBuffer = await imagesToPdf(buffers);

    return fileResponse(outputBuffer, "images.pdf", "application/pdf");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to convert images to PDF.",
      500
    );
  }
}
