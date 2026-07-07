export interface WordStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
}

const WORDS_PER_MINUTE = 200;

export function computeWordStats(text: string): WordStats {
  const trimmed = text.trim();

  const words = trimmed.length === 0 ? 0 : (trimmed.match(/\S+/g) ?? []).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed.length === 0 ? 0 : (trimmed.match(/[^.!?]+[.!?]*/g) ?? []).length;
  const paragraphs =
    trimmed.length === 0
      ? 0
      : trimmed.split(/\n\s*\n/).filter((paragraph) => paragraph.trim().length > 0).length;
  const readingTimeMinutes = words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));

  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTimeMinutes };
}
