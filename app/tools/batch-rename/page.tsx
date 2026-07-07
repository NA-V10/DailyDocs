"use client";

import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getToolBySlug } from "@/lib/tools-config";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { ProgressIndicator } from "@/components/tools/progress-indicator";
import { DownloadResult } from "@/components/tools/download-result";
import { RecentHistory } from "@/components/tools/recent-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useBatchRename } from "@/features/batch-rename/use-batch-rename";
import { formatBytes } from "@/lib/file-validation";
import { buildFileName } from "@/lib/files/batch-rename";
import { RENAME_SEPARATORS } from "@/lib/constants";
import {
  batchRenameFormSchema,
  type BatchRenameFormValues,
} from "@/lib/validation/batch-rename-schema";

const tool = getToolBySlug("batch-rename")!;
const PREVIEW_LIMIT = 5;

export default function BatchRenamePage() {
  const upload = useFileUpload({
    accept: tool.accept,
    acceptMime: tool.acceptMime,
    maxFileSizeBytes: tool.maxFileSizeBytes,
    maxFiles: tool.maxFiles,
  });
  const { state, percent, error, result, process, reset, download } = useBatchRename();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<BatchRenameFormValues>({
    resolver: zodResolver(batchRenameFormSchema),
    defaultValues: { baseName: "Certificate", startNumber: 1, padding: 0, separator: "-" },
  });

  const watched = useWatch({ control });

  const previewNames = useMemo(() => {
    if (upload.files.length === 0) return [];

    const options = {
      baseName: watched.baseName?.trim() || "file",
      startNumber: Number.isFinite(watched.startNumber) ? Number(watched.startNumber) : 1,
      padding: Number.isFinite(watched.padding) ? Number(watched.padding) : 0,
      separator: watched.separator ?? "-",
    };

    return upload.files
      .slice(0, PREVIEW_LIMIT)
      .map((file, index) => buildFileName(file.name, index, options));
  }, [upload.files, watched.baseName, watched.startNumber, watched.padding, watched.separator]);

  const isBusy = state === "uploading" || state === "processing";

  function handleReset() {
    reset();
    upload.clearFiles();
  }

  function onSubmit(values: BatchRenameFormValues) {
    if (upload.files.length === 0) return;
    process(upload.files, values);
  }

  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      {state === "success" && result ? (
        <DownloadResult filename={result.filename} onDownload={download} onReset={handleReset} />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <FileDropzone
            accept={tool.accept}
            multiple
            maxSizeLabel={formatBytes(tool.maxFileSizeBytes)}
            files={upload.files}
            isDragging={upload.isDragging}
            error={upload.error ?? error}
            disabled={isBusy}
            onFilesAdded={upload.addFiles}
            onRemoveFile={upload.removeFile}
            onDragStateChange={upload.setIsDragging}
            onMoveFile={upload.reorderFiles}
          />

          <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="baseName">Base name</Label>
              <Input
                id="baseName"
                placeholder="Certificate"
                disabled={isBusy}
                aria-invalid={Boolean(errors.baseName)}
                className="mt-1.5"
                {...register("baseName")}
              />
              {errors.baseName && (
                <p role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors.baseName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="startNumber">Start number</Label>
              <Input
                id="startNumber"
                type="number"
                disabled={isBusy}
                aria-invalid={Boolean(errors.startNumber)}
                className="mt-1.5"
                {...register("startNumber", { valueAsNumber: true })}
              />
              {errors.startNumber && (
                <p role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors.startNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="padding">Zero-padding (digits)</Label>
              <Input
                id="padding"
                type="number"
                disabled={isBusy}
                aria-invalid={Boolean(errors.padding)}
                className="mt-1.5"
                {...register("padding", { valueAsNumber: true })}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                e.g. 2 digits → 01, 02... Leave at 0 for 1, 2, 3...
              </p>
              {errors.padding && (
                <p role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors.padding.message}
                </p>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">Separator</p>
              <Controller
                control={control}
                name="separator"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isBusy}
                    className="grid-cols-2 gap-2"
                  >
                    {RENAME_SEPARATORS.map((option) => (
                      <div key={option.label} className="flex items-center gap-2">
                        <RadioGroupItem value={option.value} id={`sep-${option.label}`} />
                        <Label htmlFor={`sep-${option.label}`} className="font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>
          </div>

          {previewNames.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-2 text-sm font-medium">Preview</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {previewNames.map((name) => (
                  <li key={name} className="truncate font-mono text-xs">
                    {name}
                  </li>
                ))}
                {upload.files.length > PREVIEW_LIMIT && (
                  <li className="text-xs">
                    ...and {upload.files.length - PREVIEW_LIMIT} more
                  </li>
                )}
              </ul>
            </div>
          )}

          <ProgressIndicator state={state} percent={percent} />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={upload.files.length === 0 || isBusy}
          >
            Rename Files
          </Button>
        </form>
      )}

      <RecentHistory toolSlug={tool.slug} />
    </ToolLayout>
  );
}
