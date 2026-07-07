"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "pdf-to-images", toolName: "PDF to Images" };

export function usePdfToImages() {
  const processor = useToolProcessor("/api/tools/pdf-to-images", HISTORY_TOOL);

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
