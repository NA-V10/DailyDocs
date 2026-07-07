import { NextRequest } from "next/server";
import { rotatePdf, type RotationDirection } from "@/lib/pdf/rotate";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { baseFileName } from "@/lib/filename";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";

export const runtime = "nodejs";

const tool = getToolBySlug("rotate-pdf")!;
const VALID_DIRECTIONS: RotationDirection[] = ["clockwise", "counterclockwise", "180"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const direction = formData.get("direction");

    if (!(file instanceof File)) {
      return errorResponse("No file was uploaded.");
    }

    const validation = validateFile(file, tool);
    if (!validation.valid) {
      return errorResponse(validation.error ?? "Invalid file.");
    }

    if (typeof direction !== "string" || !VALID_DIRECTIONS.includes(direction as RotationDirection)) {
      return errorResponse("Choose a valid rotation direction.");
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await rotatePdf(inputBuffer, direction as RotationDirection);

    return fileResponse(
      outputBuffer,
      `${baseFileName(file.name)}-rotated.pdf`,
      "application/pdf"
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to rotate PDF.",
      500
    );
  }
}
