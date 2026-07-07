import { flowTextToPdf } from "@/lib/pdf/text-layout";

const MAX_TEXT_LENGTH = 200_000;

export async function textToPdf(text: string): Promise<Buffer> {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `Text is too long. Maximum length is ${MAX_TEXT_LENGTH.toLocaleString()} characters.`
    );
  }

  const paragraphs = text.split(/\r?\n/);
  return flowTextToPdf(paragraphs, "(No text was provided.)");
}
