"use client";

import { useCallback, useState } from "react";
import { validateFile } from "@/lib/file-validation";

export interface SlotUploadConfig {
  id: string;
  accept: string[];
  acceptMime: string[];
  maxFiles: number;
  maxFileSizeBytes: number;
}

/** Same shape as useFileUpload, but manages one file list per document slot. */
export function useMultiSlotUpload(slots: SlotUploadConfig[]) {
  const [filesBySlot, setFilesBySlot] = useState<Record<string, File[]>>({});
  const [errorsBySlot, setErrorsBySlot] = useState<Record<string, string | null>>({});

  const addFiles = useCallback(
    (slotId: string, incoming: FileList | File[]) => {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return;

      const incomingArray = Array.from(incoming);
      const validFiles: File[] = [];
      let error: string | null = null;

      for (const file of incomingArray) {
        const validation = validateFile(file, slot);
        if (!validation.valid) {
          error = validation.error ?? "Invalid file.";
          continue;
        }
        validFiles.push(file);
      }

      setErrorsBySlot((prev) => ({ ...prev, [slotId]: error }));
      setFilesBySlot((prev) => {
        const existing = prev[slotId] ?? [];
        const combined = slot.maxFiles === 1 ? validFiles.slice(0, 1) : [...existing, ...validFiles];
        return { ...prev, [slotId]: combined.slice(0, slot.maxFiles) };
      });
    },
    [slots]
  );

  const removeFile = useCallback((slotId: string, index: number) => {
    setFilesBySlot((prev) => ({
      ...prev,
      [slotId]: (prev[slotId] ?? []).filter((_, i) => i !== index),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setFilesBySlot({});
    setErrorsBySlot({});
  }, []);

  return { filesBySlot, errorsBySlot, addFiles, removeFile, clearAll };
}
