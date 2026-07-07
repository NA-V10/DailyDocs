import { NextRequest } from "next/server";
import { wordToPdf } from "@/lib/office/word-to-pdf";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { baseFileName } from "@/lib/filename";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";

export const runtime = "nodejs";

const tool = getToolBySlug("word-to-pdf")!;

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
    const outputBuffer = await wordToPdf(inputBuffer);

    return fileResponse(outputBuffer, `${baseFileName(file.name)}.pdf`, "application/pdf");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to convert Word document to PDF.",
      500
    );
  }
}
