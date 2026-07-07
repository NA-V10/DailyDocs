"use client";

import { useState } from "react";
import { getToolBySlug } from "@/lib/tools-config";
import { COMPRESSION_TARGETS } from "@/lib/constants";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { ProgressIndicator } from "@/components/tools/progress-indicator";
import { DownloadResult } from "@/components/tools/download-result";
import { RecentHistory } from "@/components/tools/recent-history";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useCompressPdf } from "@/features/compress-pdf/use-compress-pdf";
import { formatBytes } from "@/lib/file-validation";

const tool = getToolBySlug("compress-pdf")!;

export default function CompressPdfPage() {
  const upload = useFileUpload({
    accept: tool.accept,
    acceptMime: tool.acceptMime,
    maxFileSizeBytes: tool.maxFileSizeBytes,
    maxFiles: tool.maxFiles,
  });
  const { state, percent, error, result, stats, process, reset, download } = useCompressPdf();
  const [target, setTarget] = useState(COMPRESSION_TARGETS[0].id);

  const isBusy = state === "uploading" || state === "processing";

  function handleReset() {
    reset();
    upload.clearFiles();
  }

  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      {state === "success" && result ? (
        <DownloadResult
          filename={result.filename}
          stats={stats}
          onDownload={download}
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            accept={tool.accept}
            multiple={false}
            maxSizeLabel={formatBytes(tool.maxFileSizeBytes)}
            files={upload.files}
            isDragging={upload.isDragging}
            error={upload.error ?? error}
            disabled={isBusy}
            onFilesAdded={upload.addFiles}
            onRemoveFile={upload.removeFile}
            onDragStateChange={upload.setIsDragging}
          />

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium">Target size</p>
            <RadioGroup
              value={target}
              onValueChange={setTarget}
              disabled={isBusy}
              className="grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {COMPRESSION_TARGETS.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <RadioGroupItem value={option.id} id={`target-${option.id}`} />
                  <Label htmlFor={`target-${option.id}`} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="mt-3 text-xs text-muted-foreground">
              Handy for portals with strict upload limits — Passport Seva, government forms,
              college admissions, job applications.
            </p>
          </div>

          <ProgressIndicator state={state} percent={percent} />

          <Button
            className="w-full"
            size="lg"
            disabled={upload.files.length === 0 || isBusy}
            onClick={() => upload.files[0] && process(upload.files[0], target)}
          >
            Compress PDF
          </Button>
        </div>
      )}

      <RecentHistory toolSlug={tool.slug} />
    </ToolLayout>
  );
}
