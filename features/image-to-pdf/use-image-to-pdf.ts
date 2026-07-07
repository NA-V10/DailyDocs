"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "image-to-pdf", toolName: "Image to PDF" };

export function useImageToPdf() {
  const processor = useToolProcessor("/api/tools/image-to-pdf", HISTORY_TOOL);

  const process = useCallback(
    (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      return processor.process(
        formData,
        files.length === 1 ? files[0].name : `${files.length} images`
      );
    },
    [processor]
  );

  return { ...processor, process };
}
