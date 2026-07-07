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
import { useConvertImage } from "@/features/convert-image/use-convert-image";
import { formatBytes } from "@/lib/file-validation";
import {
  convertImageFormSchema,
  type ConvertImageFormValues,
} from "@/lib/validation/convert-image-schema";

const tool = getToolBySlug("convert-image")!;

const FORMAT_OPTIONS: { value: ConvertImageFormValues["format"]; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

export default function ConvertImagePage() {
  const upload = useFileUpload({
    accept: tool.accept,
    acceptMime: tool.acceptMime,
    maxFileSizeBytes: tool.maxFileSizeBytes,
    maxFiles: tool.maxFiles,
  });
  const { state, percent, error, result, process, reset, download } = useConvertImage();

  const { control, handleSubmit } = useForm<ConvertImageFormValues>({
    resolver: zodResolver(convertImageFormSchema),
    defaultValues: { format: "png" },
  });

  const isBusy = state === "uploading" || state === "processing";

  function handleReset() {
    reset();
    upload.clearFiles();
  }

  function onSubmit(values: ConvertImageFormValues) {
    if (!upload.files[0]) return;
    process(upload.files[0], values.format);
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
            <p className="mb-3 text-sm font-medium">Convert to</p>
            <Controller
              control={control}
              name="format"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isBusy}
                  className="gap-3 sm:grid-cols-4"
                >
                  {FORMAT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem value={option.value} id={`format-${option.value}`} />
                      <Label htmlFor={`format-${option.value}`} className="font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
          </div>

          <ProgressIndicator state={state} percent={percent} />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={upload.files.length === 0 || isBusy}
          >
            Convert Image
          </Button>
        </form>
      )}

      <RecentHistory toolSlug={tool.slug} />
    </ToolLayout>
  );
}
