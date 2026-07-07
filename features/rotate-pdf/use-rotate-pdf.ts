"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import type { RotationDirection } from "@/lib/pdf/rotate";

const HISTORY_TOOL = { tool: "rotate-pdf", toolName: "Rotate PDF" };

export function useRotatePdf() {
  const processor = useToolProcessor("/api/tools/rotate-pdf", HISTORY_TOOL);

  const process = useCallback(
    (file: File, direction: RotationDirection) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("direction", direction);
      return processor.process(formData, file.name);
    },
    [processor]
  );

  return { ...processor, process };
}
