import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressIndicator } from "@/components/tools/progress-indicator";

describe("ProgressIndicator", () => {
  it("renders nothing when idle", () => {
    const { container } = render(<ProgressIndicator state="idle" percent={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the percentage while uploading", () => {
    render(<ProgressIndicator state="uploading" percent={42} />);
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("Uploading")).toBeInTheDocument();
  });

  it("shows Done without a percentage on success", () => {
    render(<ProgressIndicator state="success" percent={100} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
  });
});
