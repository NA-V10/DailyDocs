"use client";

import { useCallback, useMemo } from "react";
import { useToolProcessor } from "@/hooks/use-tool-processor";

const HISTORY_TOOL = { tool: "portal-preset", toolName: "Portal Preset" };

export interface ManifestEntry {
  fileName: string;
  meetsRequirement: boolean;
  note: string;
}

export function usePortalPreset() {
  const processor = useToolProcessor("/api/tools/portal-preset", HISTORY_TOOL);

  const process = useCallback(
    (
      presetSlug: string,
      presetName: string,
      slotFiles: Record<string, File[]>,
      overrides: Record<string, number> = {}
    ) => {
      const formData = new FormData();
      formData.append("preset", presetSlug);

      for (const [slotId, files] of Object.entries(slotFiles)) {
        for (const file of files) {
          formData.append(slotId, file);
        }
      }

      for (const [key, value] of Object.entries(overrides)) {
        formData.append(key, String(value));
      }

      const totalFiles = Object.values(slotFiles).reduce((sum, files) => sum + files.length, 0);
      return processor.process(formData, `${presetName} package (${totalFiles} files)`);
    },
    [processor]
  );

  const manifest = useMemo<ManifestEntry[]>(() => {
    const raw = processor.result?.headers["x-manifest"];
    if (!raw) return [];
    try {
      return JSON.parse(decodeURIComponent(raw)) as ManifestEntry[];
    } catch {
      return [];
    }
  }, [processor.result]);

  return { ...processor, process, manifest };
}
