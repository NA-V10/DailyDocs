"use client";

import { getToolBySlug } from "@/lib/tools-config";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { ProgressIndicator } from "@/components/tools/progress-indicator";
import { DownloadResult } from "@/components/tools/download-result";
import { RecentHistory } from "@/components/tools/recent-history";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { usePdfToWord } from "@/features/pdf-to-word/use-pdf-to-word";
import { formatBytes } from "@/lib/file-validation";

const tool = getToolBySlug("pdf-to-word")!;

export default function PdfToWordPage() {
  const upload = useFileUpload({
    accept: tool.accept,
    acceptMime: tool.acceptMime,
    maxFileSizeBytes: tool.maxFileSizeBytes,
    maxFiles: tool.maxFiles,
  });
  const { state, percent, error, result, process, reset, download } = usePdfToWord();

  const isBusy = state === "uploading" || state === "processing";

  function handleReset() {
    reset();
    upload.clearFiles();
  }

  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      {state === "success" && result ? (
        <DownloadResult filename={result.filename} onDownload={download} onReset={handleReset} />
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

          <ProgressIndicator state={state} percent={percent} />

          <Button
            className="w-full"
            size="lg"
            disabled={upload.files.length === 0 || isBusy}
            onClick={() => upload.files[0] && process(upload.files[0])}
          >
            Convert to Word
          </Button>
        </div>
      )}

      <RecentHistory toolSlug={tool.slug} />
    </ToolLayout>
  );
}
