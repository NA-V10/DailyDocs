import { NextRequest } from "next/server";
import { mergePdfs } from "@/lib/pdf/merge";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";

export const runtime = "nodejs";

const tool = getToolBySlug("merge-pdf")!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length < 2) {
      return errorResponse("Select at least two PDF files to merge.");
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
    const outputBuffer = await mergePdfs(buffers);

    return fileResponse(outputBuffer, "merged.pdf", "application/pdf");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to merge PDFs.",
      500
    );
  }
}
