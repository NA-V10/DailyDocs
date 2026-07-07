import { CheckCircle2, AlertTriangle, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ManifestEntry } from "@/features/portal-preset/use-portal-preset";

interface PackageResultProps {
  filename: string;
  manifest: ManifestEntry[];
  onDownload: () => void;
  onReset: () => void;
}

export function PackageResult({ filename, manifest, onDownload, onReset }: PackageResultProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
        <p className="text-lg font-semibold">Your package is ready</p>
        <p className="text-sm text-muted-foreground">{filename}</p>
      </div>

      {manifest.length > 0 && (
        <ul className="space-y-2">
          {manifest.map((entry) => (
            <li
              key={entry.fileName}
              className="flex items-start gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
            >
              {entry.meetsRequirement ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{entry.fileName}</p>
                <p className="text-xs text-muted-foreground">{entry.note}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Requirements can change — always confirm against the current official notification before
        submitting.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onDownload}>
          <Download className="size-4" />
          Download
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="size-4" />
          Start over
        </Button>
      </div>
    </div>
  );
}
