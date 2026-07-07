"use client";

import { useCallback, useMemo } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "compress-pdf", toolName: "Compress PDF" };

export interface CompressPdfStats {
  originalSize: number;
  compressedSize: number;
  targetMet: boolean | null;
  imagesRecompressed: number;
}

export function useCompressPdf() {
  const processor = useToolProcessor("/api/tools/compress-pdf", HISTORY_TOOL);

  const process = useCallback(
    (file: File, targetId: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", targetId);
      return processor.process(formData, file.name);
    },
    [processor]
  );

  const stats = useMemo<CompressPdfStats | undefined>(() => {
    if (!processor.result) return undefined;
    const { headers } = processor.result;
    const originalSize = Number(headers["x-original-size"] ?? 0);
    const compressedSize = Number(headers["x-compressed-size"] ?? 0);
    const targetMetRaw = headers["x-target-met"];
    const targetMet =
      targetMetRaw === undefined || targetMetRaw === "" ? null : targetMetRaw === "true";
    const imagesRecompressed = Number(headers["x-images-recompressed"] ?? 0);
    return { originalSize, compressedSize, targetMet, imagesRecompressed };
  }, [processor.result]);

  return { ...processor, process, stats };
}
