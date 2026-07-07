"use client";

import { useCallback, useId, useRef } from "react";
import type { DragEvent } from "react";
import { UploadCloud, X, FileIcon, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/file-validation";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept: string[];
  multiple: boolean;
  maxSizeLabel: string;
  files: File[];
  isDragging: boolean;
  error: string | null;
  disabled?: boolean;
  onFilesAdded: (files: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
  onDragStateChange: (isDragging: boolean) => void;
  /** When provided, shows up/down controls so files can be reordered before processing. */
  onMoveFile?: (fromIndex: number, toIndex: number) => void;
}

export function FileDropzone({
  accept,
  multiple,
  maxSizeLabel,
  files,
  isDragging,
  error,
  disabled,
  onFilesAdded,
  onRemoveFile,
  onDragStateChange,
  onMoveFile,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      onDragStateChange(false);
      if (disabled) return;
      if (event.dataTransfer.files.length > 0) {
        onFilesAdded(event.dataTransfer.files);
      }
    },
    [disabled, onFilesAdded, onDragStateChange]
  );

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        aria-describedby={`${inputId}-hint`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) onDragStateChange(true);
        }}
        onDragLeave={() => onDragStateChange(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragging
            ? "border-primary bg-accent"
            : "border-border hover:border-primary/50 hover:bg-muted/40",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <UploadCloud className="mb-4 size-10 text-primary" aria-hidden="true" />
        <p className="text-base font-medium">
          Drag & drop your file{multiple ? "s" : ""} here
        </p>
        <p className="mt-1 text-sm text-muted-foreground">or</p>
        <Button type="button" className="mt-3" asChild>
          <label htmlFor={inputId} onClick={(event) => event.stopPropagation()}>
            Browse files
          </label>
        </Button>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept.join(",")}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              onFilesAdded(event.target.files);
            }
            event.target.value = "";
          }}
        />
        <p id={`${inputId}-hint`} className="mt-4 text-xs text-muted-foreground">
          Supported formats: {accept.join(", ")} &middot; Max size: {maxSizeLabel}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onMoveFile && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${file.name} up`}
                      disabled={disabled || index === 0}
                      onClick={() => onMoveFile(index, index - 1)}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${file.name} down`}
                      disabled={disabled || index === files.length - 1}
                      onClick={() => onMoveFile(index, index + 1)}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${file.name}`}
                  disabled={disabled}
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
