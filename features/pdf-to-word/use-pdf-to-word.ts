"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "pdf-to-word", toolName: "PDF to Word" };

export function usePdfToWord() {
  const processor = useToolProcessor("/api/tools/pdf-to-word", HISTORY_TOOL);

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
