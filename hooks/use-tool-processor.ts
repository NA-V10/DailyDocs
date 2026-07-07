"use client";

import { useCallback, useState } from "react";
import { uploadWithProgress, downloadBlob } from "@/lib/upload-client";
import { useToolHistory } from "@/hooks/use-tool-history";
import type { ToolProcessingState } from "@/types/tool";

interface ProcessedResult {
  blob: Blob;
  filename: string;
  headers: Record<string, string>;
}

interface HistoryToolInfo {
  tool: string;
  toolName: string;
}

/** Shared upload/progress/download state machine used by every tool's feature hook. */
export function useToolProcessor(endpoint: string, historyTool: HistoryToolInfo) {
  const [state, setState] = useState<ToolProcessingState>("idle");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const { addEntry } = useToolHistory();

  const process = useCallback(
    async (formData: FormData, historyFileName: string) => {
      setState("uploading");
      setPercent(0);
      setError(null);
      setResult(null);

      try {
        const { blob, filename, headers } = await uploadWithProgress(endpoint, formData, (p) => {
          setPercent(p);
          setState(p >= 71 ? "processing" : "uploading");
        });

        setResult({ blob, filename, headers });
        setState("success");
        addEntry({ tool: historyTool.tool, toolName: historyTool.toolName, fileName: historyFileName });
        downloadBlob(blob, filename);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setState("error");
      }
    },
    [endpoint, historyTool.tool, historyTool.toolName, addEntry]
  );

  const reset = useCallback(() => {
    setState("idle");
    setPercent(0);
    setError(null);
    setResult(null);
  }, []);

  const download = useCallback(() => {
    if (result) downloadBlob(result.blob, result.filename);
  }, [result]);

  return { state, percent, error, result, process, reset, download };
}
