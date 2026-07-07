"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "qr-generator", toolName: "QR Generator" };

export function useQrGenerator() {
  const processor = useToolProcessor("/api/tools/qr-generator", HISTORY_TOOL);

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
