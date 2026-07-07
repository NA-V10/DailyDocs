import { NextRequest } from "next/server";
import { generateQrPng } from "@/lib/qr/generate";
import { fileResponse, errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = formData.get("text");

    if (typeof text !== "string" || text.trim().length === 0) {
      return errorResponse("Enter some text or a URL to generate a QR code.");
    }

    const buffer = await generateQrPng(text);
    return fileResponse(buffer, "qr-code.png", "image/png");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to generate QR code.",
      500
    );
  }
}
