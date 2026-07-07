"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getToolBySlug } from "@/lib/tools-config";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ProgressIndicator } from "@/components/tools/progress-indicator";
import { DownloadResult } from "@/components/tools/download-result";
import { RecentHistory } from "@/components/tools/recent-history";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTextToPdf } from "@/features/text-to-pdf/use-text-to-pdf";
import { textToPdfFormSchema, type TextToPdfFormValues } from "@/lib/validation/text-to-pdf-schema";

const tool = getToolBySlug("text-to-pdf")!;

export default function TextToPdfPage() {
  const { state, percent, error, result, process, reset, download } = useTextToPdf();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextToPdfFormValues>({
    resolver: zodResolver(textToPdfFormSchema),
    defaultValues: { text: "" },
  });

  const isBusy = state === "uploading" || state === "processing";

  function onSubmit(values: TextToPdfFormValues) {
    process(values.text);
  }

  return (
    <ToolLayout icon={tool.icon} name={tool.name} description={tool.description}>
      {state === "success" && result ? (
        <DownloadResult filename={result.filename} onDownload={download} onReset={reset} />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              placeholder="Paste or type the text you want turned into a PDF..."
              disabled={isBusy}
              aria-invalid={Boolean(errors.text)}
              className="mt-1.5 min-h-64"
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
            Convert to PDF
          </Button>
        </form>
      )}

      <RecentHistory toolSlug={tool.slug} />
    </ToolLayout>
  );
}
