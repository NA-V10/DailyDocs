"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import type { RenamePatternOptions } from "@/lib/files/batch-rename";

const HISTORY_TOOL = { tool: "batch-rename", toolName: "Batch Rename" };

export function useBatchRename() {
  const processor = useToolProcessor("/api/tools/batch-rename", HISTORY_TOOL);

  const process = useCallback(
    (files: File[], options: RenamePatternOptions) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("baseName", options.baseName);
      formData.append("startNumber", String(options.startNumber));
      formData.append("padding", String(options.padding));
      formData.append("separator", options.separator);
      return processor.process(
        formData,
        files.length === 1 ? files[0].name : `${files.length} files renamed`
      );
    },
    [processor]
  );

  return { ...processor, process };
}
