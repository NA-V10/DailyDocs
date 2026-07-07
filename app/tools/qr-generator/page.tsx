"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getToolBySlug } from "@/lib/tools-config";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ProgressIndicator } from "@/components/tools/progress-indicator";
import { DownloadResult } from "@/components/tools/download-result";
import { RecentHistory } from "@/components/tools/recent-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQrGenerator } from "@/features/qr-generator/use-qr-generator";
import { qrFormSchema, type QrFormValues } from "@/lib/validation/qr-schema";

const tool = getToolBySlug("qr-generator")!;

export default function QrGeneratorPage() {
  const { state, percent, error, result, process, reset, download } = useQrGenerator();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QrFormValues>({
    resolver: zodResolver(qrFormSchema),
    defaultValues: { text: "" },
  });

  const isBusy = state === "uploading" || state === "processing";

  const previewUrl = useMemo(
    () => (result ? URL.createObjectURL(result.blob) : null),
    [result]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onSubmit(values: QrFormValues) {
    process(values.text);
  }

  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      {state === "success" && result ? (
        <DownloadResult
          filename={result.filename}
          message="Your QR code is ready"
          previewUrl={previewUrl}
          onDownload={download}
          onReset={reset}
        />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="text">Text or URL</Label>
            <Input
              id="text"
              placeholder="https://example.com or any text"
              disabled={isBusy}
              aria-invalid={Boolean(errors.text)}
              className="mt-1.5"
              {...register("text")}
            />
            {errors.text && (
              <p role="alert" className="mt-1.5 text-sm text-destructive">
                {errors.text.message}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-1.5 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <ProgressIndicator state={state} percent={percent} />

          <Button type="submit" className="w-full" size="lg" disabled={isBusy}>
            Generate QR Code
          </Button>
        </form>
      )}

      <RecentHistory toolSlug={tool.slug} />
    </ToolLayout>
  );
}
