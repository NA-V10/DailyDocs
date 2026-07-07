"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "merge-pdf", toolName: "Merge PDF" };

export function useMergePdf() {
  const processor = useToolProcessor("/api/tools/merge-pdf", HISTORY_TOOL);

  const process = useCallback(
    (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      return processor.process(formData, `${files.length} files merged`);
    },
    [processor]
  );

  return { ...processor, process };
}
