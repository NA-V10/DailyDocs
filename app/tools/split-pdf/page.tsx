"use client";

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
import { useSplitPdf } from "@/features/split-pdf/use-split-pdf";
import { formatBytes } from "@/lib/file-validation";
import { splitFormSchema, type SplitFormValues } from "@/lib/validation/split-schema";

const tool = getToolBySlug("split-pdf")!;

export default function SplitPdfPage() {
  const upload = useFileUpload({
    accept: tool.accept,
    acceptMime: tool.acceptMime,
    maxFileSizeBytes: tool.maxFileSizeBytes,
    maxFiles: tool.maxFiles,
  });
  const { state, percent, error, result, process, reset, download } = useSplitPdf();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<SplitFormValues>({
    resolver: zodResolver(splitFormSchema),
    defaultValues: { mode: "all", ranges: "" },
  });

  const mode = useWatch({ control, name: "mode" });
  const isBusy = state === "uploading" || state === "processing";

  function handleReset() {
    reset();
    upload.clearFiles();
  }

  function onSubmit(values: SplitFormValues) {
    if (!upload.files[0]) return;
    process(upload.files[0], { mode: values.mode, ranges: values.ranges });
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

          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isBusy}
                  className="gap-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="mode-all" />
                    <Label htmlFor="mode-all" className="font-normal">
                      Extract every page as its own file
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ranges" id="mode-ranges" />
                    <Label htmlFor="mode-ranges" className="font-normal">
                      Custom page ranges
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />

            {mode === "ranges" && (
              <div className="pl-6">
                <Label htmlFor="ranges" className="sr-only">
                  Page ranges
                </Label>
                <Input
                  id="ranges"
                  placeholder="e.g. 1-3, 5, 7-9"
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.ranges)}
                  {...register("ranges")}
                />
                {errors.ranges && (
                  <p role="alert" className="mt-1.5 text-sm text-destructive">
                    {errors.ranges.message}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Each range becomes a separate file, delivered as a zip.
                </p>
              </div>
            )}
          </div>

          <ProgressIndicator state={state} percent={percent} />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={upload.files.length === 0 || isBusy}
          >
            Split PDF
          </Button>
        </form>
      )}

      <RecentHistory toolSlug={tool.slug} />
    </ToolLayout>
  );
}
