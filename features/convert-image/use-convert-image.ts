"use client";

import { useCallback } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import type { ImageFormat } from "@/lib/image/convert";

const HISTORY_TOOL = { tool: "convert-image", toolName: "Convert Image" };

export function useConvertImage() {
  const processor = useToolProcessor("/api/tools/convert-image", HISTORY_TOOL);

  const process = useCallback(
    (file: File, format: ImageFormat) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", format);
      return processor.process(formData, file.name);
    },
    [processor]
  );

  return { ...processor, process };
}
