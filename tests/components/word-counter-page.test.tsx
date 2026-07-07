import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WordCounterPage from "@/app/tools/word-counter/page";

describe("WordCounterPage", () => {
  it("updates word and character counts live as the user types", async () => {
    const user = userEvent.setup();
    render(<WordCounterPage />);

    const textarea = screen.getByPlaceholderText(/start typing or paste/i);
    await user.type(textarea, "Hello world");

    const statusRegion = screen.getByRole("status", { name: /text statistics/i });
    expect(statusRegion).toHaveTextContent("2");
    expect(statusRegion).toHaveTextContent("11");
  });

  it("shows all-zero stats before any text is entered", () => {
    render(<WordCounterPage />);

    const statusRegion = screen.getByRole("status", { name: /text statistics/i });
    expect(statusRegion).toHaveTextContent("Words");
    // All 6 tiles (Words, Characters, Characters no spaces, Sentences, Paragraphs, Reading time)
    // should read "0" before any text is entered.
    expect(screen.getAllByText("0")).toHaveLength(6);
  });
});
