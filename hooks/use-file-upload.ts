"use client";

import { useCallback, useState } from "react";
import { validateFile } from "@/lib/file-validation";

export interface UseFileUploadOptions {
  accept: string[];
  acceptMime: string[];
  maxFileSizeBytes: number;
  maxFiles: number;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const incomingArray = Array.from(incoming);
      setError(null);

      const validFiles: File[] = [];
      for (const file of incomingArray) {
        const validation = validateFile(file, options);
        if (!validation.valid) {
          setError(validation.error ?? "Invalid file.");
          continue;
        }
        validFiles.push(file);
      }

      setFiles((prev) => {
        const combined =
          options.maxFiles === 1 ? validFiles.slice(0, 1) : [...prev, ...validFiles];
        return combined.slice(0, options.maxFiles);
      });
    },
    [options]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  return {
    files,
    error,
    isDragging,
    setIsDragging,
    addFiles,
    removeFile,
    clearFiles,
    reorderFiles,
  };
}
