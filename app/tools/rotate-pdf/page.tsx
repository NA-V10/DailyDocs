"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getToolBySlug } from "@/lib/tools-config";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { ProgressIndicator } from "@/components/tools/progress-indicator";
import { DownloadResult } from "@/components/tools/download-result";
import { RecentHistory } from "@/components/tools/recent-history";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useRotatePdf } from "@/features/rotate-pdf/use-rotate-pdf";
import { formatBytes } from "@/lib/file-validation";
import { rotateFormSchema, type RotateFormValues } from "@/lib/validation/rotate-schema";

const tool = getToolBySlug("rotate-pdf")!;

export default function RotatePdfPage() {
  const upload = useFileUpload({
    accept: tool.accept,
    acceptMime: tool.acceptMime,
    maxFileSizeBytes: tool.maxFileSizeBytes,
    maxFiles: tool.maxFiles,
  });
  const { state, percent, error, result, process, reset, download } = useRotatePdf();

  const { control, handleSubmit } = useForm<RotateFormValues>({
    resolver: zodResolver(rotateFormSchema),
    defaultValues: { direction: "clockwise" },
  });

  const isBusy = state === "uploading" || state === "processing";

  function handleReset() {
    reset();
    upload.clearFiles();
  }

  function onSubmit(values: RotateFormValues) {
    if (!upload.files[0]) return;
    process(upload.files[0], values.direction);
  }

  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      {state === "success" && result ? (
        <DownloadResult filename={result.filename} onDownload={download} onReset={handleReset} />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
            <p className="mb-3 text-sm font-medium">Rotation</p>
            <Controller
              control={control}
              name="direction"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isBusy}
                  className="gap-3 sm:grid-cols-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="clockwise" id="dir-clockwise" />
                    <Label htmlFor="dir-clockwise" className="font-normal">
                      90° clockwise
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="counterclockwise" id="dir-counterclockwise" />
                    <Label htmlFor="dir-counterclockwise" className="font-normal">
                      90° counter-clockwise
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="180" id="dir-180" />
                    <Label htmlFor="dir-180" className="font-normal">
                      180°
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Applies to every page in the document.
            </p>
          </div>

          <ProgressIndicator state={state} percent={percent} />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={upload.files.length === 0 || isBusy}
          >
            Rotate PDF
          </Button>
        </form>
      )}

      <RecentHistory toolSlug={tool.slug} />
    </ToolLayout>
  );
}
