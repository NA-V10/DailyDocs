import { NextRequest } from "next/server";
import { textToPdf } from "@/lib/text/text-to-pdf";
import { fileResponse, errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = formData.get("text");

    if (typeof text !== "string" || text.trim().length === 0) {
      return errorResponse("Enter some text to convert.");
    }

    const buffer = await textToPdf(text);
    return fileResponse(buffer, "text.pdf", "application/pdf");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to convert text to PDF.",
      500
    );
  }
}
