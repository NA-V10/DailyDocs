"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToolHistory } from "@/hooks/use-tool-history";

interface RecentHistoryProps {
  toolSlug: string;
}

export function RecentHistory({ toolSlug }: RecentHistoryProps) {
  const { entries, clearHistory } = useToolHistory(toolSlug);

  if (entries.length === 0) return null;

  return (
    <section aria-label="Recent activity" className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Clock className="size-4" aria-hidden="true" />
          Recent on this device
        </h2>
        <Button variant="ghost" size="sm" onClick={clearHistory}>
          Clear
        </Button>
      </div>
      <ul className="space-y-1.5 text-sm">
        {entries.map((entry) => (
          <li
            key={entry.timestamp}
            className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
          >
            <span className="truncate">{entry.fileName}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
