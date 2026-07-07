"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "split-pdf", toolName: "Split PDF" };

export interface SplitOptions {
  mode: "all" | "ranges";
  ranges?: string;
}

export function useSplitPdf() {
  const processor = useToolProcessor("/api/tools/split-pdf", HISTORY_TOOL);

  const process = useCallback(
    (file: File, options: SplitOptions) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", options.mode);
      if (options.ranges) formData.append("ranges", options.ranges);
      return processor.process(formData, file.name);
    },
    [processor]
  );

  return { ...processor, process };
}
