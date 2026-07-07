import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileDropzone } from "@/components/tools/file-dropzone";

describe("FileDropzone", () => {
  it("renders hint text with accepted formats and max size", () => {
    render(
      <FileDropzone
        accept={[".pdf"]}
        multiple={false}
        maxSizeLabel="25 MB"
        files={[]}
        isDragging={false}
        error={null}
        onFilesAdded={vi.fn()}
        onRemoveFile={vi.fn()}
        onDragStateChange={vi.fn()}
      />
    );
    expect(screen.getByText(/Supported formats: .pdf/)).toBeInTheDocument();
    expect(screen.getByText(/Max size: 25 MB/)).toBeInTheDocument();
  });

  it("shows an error message when provided", () => {
    render(
      <FileDropzone
        accept={[".pdf"]}
        multiple={false}
        maxSizeLabel="25 MB"
        files={[]}
        isDragging={false}
        error="File too large."
        onFilesAdded={vi.fn()}
        onRemoveFile={vi.fn()}
        onDragStateChange={vi.fn()}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("File too large.");
  });

  it("lists selected files and calls onRemoveFile", async () => {
    const user = userEvent.setup();
    const onRemoveFile = vi.fn();
    const file = new File(["hello"], "test.pdf", { type: "application/pdf" });

    render(
      <FileDropzone
        accept={[".pdf"]}
        multiple={false}
        maxSizeLabel="25 MB"
        files={[file]}
        isDragging={false}
        error={null}
        onFilesAdded={vi.fn()}
        onRemoveFile={onRemoveFile}
        onDragStateChange={vi.fn()}
      />
    );

    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove test.pdf/i }));
    expect(onRemoveFile).toHaveBeenCalledWith(0);
  });
});
