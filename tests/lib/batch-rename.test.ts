import { describe, expect, it } from "vitest";
import { buildFileName, buildRenamedFiles, sanitizeBaseName } from "@/lib/files/batch-rename";

describe("buildFileName", () => {
  it("matches the classic Certificate-1, Certificate-2 pattern with no padding", () => {
    const options = { baseName: "Certificate", startNumber: 1, padding: 0, separator: "-" };
    expect(buildFileName("scan.pdf", 0, options)).toBe("Certificate-1.pdf");
    expect(buildFileName("scan.pdf", 1, options)).toBe("Certificate-2.pdf");
    expect(buildFileName("scan.pdf", 2, options)).toBe("Certificate-3.pdf");
  });

  it("zero-pads the number when padding is set", () => {
    const options = { baseName: "Semester", startNumber: 1, padding: 2, separator: "-" };
    expect(buildFileName("a.pdf", 0, options)).toBe("Semester-01.pdf");
    expect(buildFileName("a.pdf", 9, options)).toBe("Semester-10.pdf");
  });

  it("honors a custom start number", () => {
    const options = { baseName: "Photo", startNumber: 101, padding: 0, separator: "_" };
    expect(buildFileName("img.jpg", 0, options)).toBe("Photo_101.jpg");
  });

  it("supports each separator option, including none", () => {
    expect(
      buildFileName("a.png", 0, { baseName: "IMG", startNumber: 1, padding: 0, separator: "" })
    ).toBe("IMG1.png");
    expect(
      buildFileName("a.png", 0, { baseName: "IMG", startNumber: 1, padding: 0, separator: " " })
    ).toBe("IMG 1.png");
  });

  it("preserves each file's own extension", () => {
    const options = { baseName: "File", startNumber: 1, padding: 0, separator: "-" };
    expect(buildFileName("report.docx", 0, options)).toBe("File-1.docx");
    expect(buildFileName("no-extension", 0, options)).toBe("File-1");
  });

  it("sanitizes an unsafe base name", () => {
    const options = { baseName: "../../etc/passwd", startNumber: 1, padding: 0, separator: "-" };
    const result = buildFileName("a.pdf", 0, options);
    expect(result).not.toContain("/");
    expect(result).not.toContain("..");
  });
});

describe("sanitizeBaseName", () => {
  it("strips characters outside the safe set", () => {
    expect(sanitizeBaseName("Report/2024:Final")).toBe("Report2024Final");
  });

  it("falls back to \"file\" for an all-unsafe input", () => {
    expect(sanitizeBaseName("///")).toBe("file");
  });

  it("keeps letters, numbers, spaces, hyphens, and underscores", () => {
    expect(sanitizeBaseName("My Report_v2-final")).toBe("My Report_v2-final");
  });
});

describe("buildRenamedFiles", () => {
  it("renames a batch of files sequentially in the given order", () => {
    const files = [
      { name: "a.pdf", data: Buffer.from("a") },
      { name: "b.pdf", data: Buffer.from("b") },
      { name: "c.pdf", data: Buffer.from("c") },
    ];
    const options = { baseName: "Certificate", startNumber: 1, padding: 0, separator: "-" };

    const renamed = buildRenamedFiles(files, options);

    expect(renamed.map((f) => f.name)).toEqual([
      "Certificate-1.pdf",
      "Certificate-2.pdf",
      "Certificate-3.pdf",
    ]);
    expect(renamed[0].data).toEqual(Buffer.from("a"));
  });

  it("preserves file contents unchanged", () => {
    const files = [{ name: "x.pdf", data: Buffer.from("original bytes") }];
    const renamed = buildRenamedFiles(files, {
      baseName: "Doc",
      startNumber: 1,
      padding: 0,
      separator: "-",
    });
    expect(renamed[0].data.toString()).toBe("original bytes");
  });
});
