import { NextResponse } from "next/server";

export function fileResponse(
  data: Buffer,
  filename: string,
  contentType: string
): NextResponse {
  const body = new Uint8Array(data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${sanitizeHeaderValue(filename)}"`,
      "Content-Length": String(data.length),
    },
  });
}

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
}
