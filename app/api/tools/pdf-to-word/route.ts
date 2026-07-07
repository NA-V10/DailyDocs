import { NextRequest } from "next/server";
import { pdfToWord } from "@/lib/pdf/to-word";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { baseFileName } from "@/lib/filename";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";

export const runtime = "nodejs";

const tool = getToolBySlug("pdf-to-word")!;
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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
    const outputBuffer = await pdfToWord(inputBuffer);

    return fileResponse(outputBuffer, `${baseFileName(file.name)}.docx`, DOCX_MIME);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to convert PDF to Word.",
      500
    );
  }
}
