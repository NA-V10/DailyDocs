import { CheckCircle2, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/file-validation";

interface SizeStats {
  originalSize: number;
  compressedSize: number;
  /** true = hit the requested target, false = missed it, undefined/null = no target was requested */
  targetMet?: boolean | null;
}

interface DownloadResultProps {
  filename: string;
  message?: string;
  stats?: SizeStats;
  /** Object URL for an image preview, shown above the download buttons. */
  previewUrl?: string | null;
  onDownload: () => void;
  onReset: () => void;
}

export function DownloadResult({
  filename,
  message,
  stats,
  previewUrl,
  onDownload,
  onReset,
}: DownloadResultProps) {
  const reduction =
    stats && stats.originalSize > 0
      ? Math.round((1 - stats.compressedSize / stats.originalSize) * 100)
      : null;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
      <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
      <div>
        <p className="text-lg font-semibold">{message ?? "Your file is ready"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{filename}</p>
      </div>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- blob: URLs aren't compatible with next/image's optimizer
        <img
          src={previewUrl}
          alt="Preview of the generated file"
          className="max-h-64 w-auto rounded-lg border border-border"
        />
      )}

      {stats && (
        <div className="w-full rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <p className="font-medium">
            {formatBytes(stats.originalSize)}
            <span className="text-muted-foreground"> → </span>
            {formatBytes(stats.compressedSize)}
            {reduction !== null && reduction > 0 && (
              <span className="text-primary"> · {reduction}% smaller</span>
            )}
          </p>
          {stats.targetMet === false && (
            <p className="mt-1 text-xs text-muted-foreground">
              Couldn&apos;t reach the target size without unacceptable quality loss — this is the
              smallest we could get.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onDownload}>
          <Download className="size-4" />
          Download
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="size-4" />
          Process another file
        </Button>
      </div>
    </div>
  );
}
