"use client";

import { useState } from "react";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { formatBytes } from "@/lib/file-validation";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import type { DocumentSlot } from "@/lib/portal-presets/types";

interface DocumentSlotUploaderProps {
  slot: DocumentSlot;
  accept: string[];
  files: File[];
  error: string | null;
  disabled?: boolean;
  onFilesAdded: (files: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
}

export function DocumentSlotUploader({
  slot,
  accept,
  files,
  error,
  disabled,
  onFilesAdded,
  onRemoveFile,
}: DocumentSlotUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const requirementText = slot.targetDimensions
    ? `Target: ${slot.targetDimensions.width}×${slot.targetDimensions.height}px, ${
        slot.minSizeBytes ? `${Math.round(slot.minSizeBytes / 1024)}–` : "up to "
      }${Math.round(slot.maxSizeBytes / 1024)} KB`
    : `Max ${Math.round(slot.maxSizeBytes / 1024)} KB`;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">
          {slot.label}
          {slot.required && <span className="text-destructive"> *</span>}
        </p>
        <p className="text-xs text-muted-foreground">{slot.helpText}</p>
        <p className="mt-0.5 text-xs font-medium text-primary">{requirementText}</p>
      </div>
      <FileDropzone
        accept={accept}
        multiple={slot.multiple}
        maxSizeLabel={formatBytes(MAX_FILE_SIZE_BYTES)}
        files={files}
        isDragging={isDragging}
        error={error}
        disabled={disabled}
        onFilesAdded={onFilesAdded}
        onRemoveFile={onRemoveFile}
        onDragStateChange={setIsDragging}
      />
    </div>
  );
}
