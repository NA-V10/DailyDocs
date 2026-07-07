"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "word-to-pdf", toolName: "Word to PDF" };

export function useWordToPdf() {
  const processor = useToolProcessor("/api/tools/word-to-pdf", HISTORY_TOOL);

  const process = useCallback(
    (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return processor.process(formData, file.name);
    },
    [processor]
  );

  return { ...processor, process };
}
