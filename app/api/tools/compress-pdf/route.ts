import { NextRequest } from "next/server";
import { compressPdf } from "@/lib/pdf/compress";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { baseFileName } from "@/lib/filename";
import { validateFile } from "@/lib/file-validation";
import { getToolBySlug } from "@/lib/tools-config";
import { getCompressionTarget } from "@/lib/constants";

export const runtime = "nodejs";

const tool = getToolBySlug("compress-pdf")!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const targetId = formData.get("target");

    if (!(file instanceof File)) {
      return errorResponse("No file was uploaded.");
    }

    const validation = validateFile(file, tool);
    if (!validation.valid) {
      return errorResponse(validation.error ?? "Invalid file.");
    }

    const target = getCompressionTarget(typeof targetId === "string" ? targetId : "best");
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const result = await compressPdf(inputBuffer, { targetBytes: target.bytes });

    const response = fileResponse(
      result.buffer,
      `${baseFileName(file.name)}-compressed.pdf`,
      "application/pdf"
    );
    response.headers.set("X-Original-Size", String(result.originalSize));
    response.headers.set("X-Compressed-Size", String(result.compressedSize));
    response.headers.set(
      "X-Target-Met",
      result.targetMet === null ? "" : String(result.targetMet)
    );
    response.headers.set("X-Images-Recompressed", String(result.imagesRecompressed));
    return response;
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to compress PDF.",
      500
    );
  }
}
