"use client";

import { getToolBySlug } from "@/lib/tools-config";
import { ToolLayout } from "@/components/tools/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWordCounter } from "@/features/word-counter/use-word-counter";

const tool = getToolBySlug("word-counter")!;

export default function WordCounterPage() {
  const { text, setText, stats } = useWordCounter();

  const tiles: { label: string; value: number }[] = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Reading time (min)", value: stats.readingTimeMinutes },
  ];

  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      <div className="space-y-6">
        <div>
          <Label htmlFor="text" className="sr-only">
            Text to count
          </Label>
          <Textarea
            id="text"
            placeholder="Start typing or paste your text here..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-h-64"
          />
        </div>

        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          role="status"
          aria-live="polite"
          aria-label="Text statistics"
        >
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <p className="text-2xl font-semibold tabular-nums">{tile.value.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tile.label}</p>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
