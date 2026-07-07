import { describe, expect, it } from "vitest";
import { computeWordStats } from "@/lib/text/word-stats";

describe("computeWordStats", () => {
  it("returns all zeros for empty input", () => {
    expect(computeWordStats("")).toEqual({
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
    });
  });

  it("counts words and characters correctly", () => {
    const stats = computeWordStats("Hello world");
    expect(stats.words).toBe(2);
    expect(stats.characters).toBe(11);
    expect(stats.charactersNoSpaces).toBe(10);
  });

  it("counts sentences by terminal punctuation", () => {
    const stats = computeWordStats("Hello there. How are you? Great!");
    expect(stats.sentences).toBe(3);
  });

  it("counts paragraphs separated by blank lines", () => {
    const stats = computeWordStats("First paragraph.\n\nSecond paragraph.\n\nThird.");
    expect(stats.paragraphs).toBe(3);
  });

  it("estimates reading time at 200 words per minute, minimum 1", () => {
    const shortText = computeWordStats("just a few words here");
    expect(shortText.readingTimeMinutes).toBe(1);

    const longText = computeWordStats(Array.from({ length: 600 }, () => "word").join(" "));
    expect(longText.readingTimeMinutes).toBe(3);
  });

  it("treats whitespace-only input as empty", () => {
    const stats = computeWordStats("   \n\t  ");
    expect(stats.words).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.paragraphs).toBe(0);
  });
});
