"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "text-to-pdf", toolName: "Text to PDF" };

export function useTextToPdf() {
  const processor = useToolProcessor("/api/tools/text-to-pdf", HISTORY_TOOL);

  const process = useCallback(
    (text: string) => {
      const formData = new FormData();
      formData.append("text", text);
      const label = text.length > 40 ? `${text.slice(0, 40)}…` : text;
      return processor.process(formData, label);
    },
    [processor]
  );

  return { ...processor, process };
}
