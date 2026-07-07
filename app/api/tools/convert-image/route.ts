import { NextRequest } from "next/server";
import { convertImage, mimeForFormat, extensionForFormat, type ImageFormat } from "@/lib/image/convert";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { baseFileName } from "@/lib/filename";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";

export const runtime = "nodejs";

const tool = getToolBySlug("convert-image")!;
const VALID_FORMATS: ImageFormat[] = ["png", "jpeg", "webp", "avif"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const format = formData.get("format");

    if (!(file instanceof File)) {
      return errorResponse("No file was uploaded.");
    }

    const validation = validateFile(file, tool);
    if (!validation.valid) {
      return errorResponse(validation.error ?? "Invalid file.");
    }

    if (typeof format !== "string" || !VALID_FORMATS.includes(format as ImageFormat)) {
      return errorResponse("Choose a valid output format.");
    }

    const targetFormat = format as ImageFormat;
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await convertImage(inputBuffer, targetFormat);

    return fileResponse(
      outputBuffer,
      `${baseFileName(file.name)}.${extensionForFormat(targetFormat)}`,
      mimeForFormat(targetFormat)
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to convert image.",
      500
    );
  }
}
