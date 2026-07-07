import { describe, expect, it } from "vitest";
import { validateFile, formatBytes } from "@/lib/file-validation";

describe("validateFile", () => {
  const options = { accept: [".pdf"], acceptMime: ["application/pdf"], maxFileSizeBytes: 1000 };

  it("accepts a valid file", () => {
    const result = validateFile({ name: "a.pdf", size: 500, type: "application/pdf" }, options);
    expect(result.valid).toBe(true);
  });

  it("rejects oversized files", () => {
    const result = validateFile({ name: "a.pdf", size: 2000, type: "application/pdf" }, options);
    expect(result.valid).toBe(false);
  });

  it("rejects unsupported types", () => {
    const result = validateFile(
      { name: "a.exe", size: 500, type: "application/x-msdownload" },
      options
    );
    expect(result.valid).toBe(false);
  });

  it("accepts by extension even if mime type is generic", () => {
    const result = validateFile(
      { name: "a.pdf", size: 500, type: "application/octet-stream" },
      options
    );
    expect(result.valid).toBe(true);
  });

  it("accepts any file type when accept and acceptMime are both empty (Batch Rename)", () => {
    const noRestrictionOptions = { accept: [], acceptMime: [], maxFileSizeBytes: 1000 };
    const result = validateFile(
      { name: "anything.xyz", size: 500, type: "application/x-whatever" },
      noRestrictionOptions
    );
    expect(result.valid).toBe(true);
  });

  it("still enforces size limits when there is no type restriction", () => {
    const noRestrictionOptions = { accept: [], acceptMime: [], maxFileSizeBytes: 1000 };
    const result = validateFile(
      { name: "anything.xyz", size: 2000, type: "application/x-whatever" },
      noRestrictionOptions
    );
    expect(result.valid).toBe(false);
  });
});

describe("formatBytes", () => {
  it("formats bytes into human readable units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});
