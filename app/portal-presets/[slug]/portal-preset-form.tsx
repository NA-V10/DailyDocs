"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressIndicator } from "@/components/tools/progress-indicator";
import { DocumentSlotUploader } from "@/components/portal-presets/document-slot-uploader";
import { PackageResult } from "@/components/portal-presets/package-result";
import { useMultiSlotUpload } from "@/hooks/use-multi-slot-upload";
import { usePortalPreset } from "@/features/portal-preset/use-portal-preset";
import { acceptForSlot, acceptMimeForSlot } from "@/lib/portal-presets/slot-accept";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import type { PortalPreset } from "@/lib/portal-presets/types";

interface PortalPresetFormProps {
  preset: PortalPreset;
}

export function PortalPresetForm({ preset }: PortalPresetFormProps) {
  const slotConfigs = useMemo(
    () =>
      preset.slots.map((slot) => ({
        id: slot.id,
        accept: acceptForSlot(slot),
        acceptMime: acceptMimeForSlot(slot),
        maxFiles: slot.multiple ? 10 : 1,
        maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
      })),
    [preset.slots]
  );

  const upload = useMultiSlotUpload(slotConfigs);
  const { state, percent, error, result, manifest, process, reset, download } = usePortalPreset();
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const isBusy = state === "uploading" || state === "processing";
  const hasAnyFile = Object.values(upload.filesBySlot).some((files) => files.length > 0);

  function handleReset() {
    reset();
    upload.clearAll();
  }

  function handleOverrideChange(key: string, value: string) {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    const numericOverrides: Record<string, number> = {};
    if (preset.isCustom) {
      for (const [key, value] of Object.entries(overrides)) {
        const parsed = Number(value);
        if (value && Number.isFinite(parsed) && parsed > 0) {
          numericOverrides[key] = parsed;
        }
      }
    }
    process(preset.slug, preset.name, upload.filesBySlot, numericOverrides);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/portal-presets"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All portal presets
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{preset.name}</h1>
        <p className="mt-1 text-muted-foreground">{preset.description}</p>
      </div>

      {state === "success" && result ? (
        <PackageResult
          filename={result.filename}
          manifest={manifest}
          onDownload={download}
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6">
          {preset.slots.map((slot) => (
            <div key={slot.id} className="space-y-3">
              <DocumentSlotUploader
                slot={slot}
                accept={acceptForSlot(slot)}
                files={upload.filesBySlot[slot.id] ?? []}
                error={upload.errorsBySlot[slot.id] ?? null}
                disabled={isBusy}
                onFilesAdded={(files) => upload.addFiles(slot.id, files)}
                onRemoveFile={(index) => upload.removeFile(slot.id, index)}
              />
              {preset.isCustom && (slot.kind === "photo" || slot.kind === "signature") && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-4">
                  <div>
                    <Label htmlFor={`${slot.id}-width`} className="text-xs">
                      Width (px)
                    </Label>
                    <Input
                      id={`${slot.id}-width`}
                      type="number"
                      placeholder={String(slot.targetDimensions?.width ?? "")}
                      value={overrides[`${slot.id}_width`] ?? ""}
                      onChange={(e) => handleOverrideChange(`${slot.id}_width`, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${slot.id}-height`} className="text-xs">
                      Height (px)
                    </Label>
                    <Input
                      id={`${slot.id}-height`}
                      type="number"
                      placeholder={String(slot.targetDimensions?.height ?? "")}
                      value={overrides[`${slot.id}_height`] ?? ""}
                      onChange={(e) => handleOverrideChange(`${slot.id}_height`, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${slot.id}-min`} className="text-xs">
                      Min (KB)
                    </Label>
                    <Input
                      id={`${slot.id}-min`}
                      type="number"
                      placeholder={slot.minSizeBytes ? String(Math.round(slot.minSizeBytes / 1024)) : "0"}
                      value={overrides[`${slot.id}_minSizeBytes`] ?? ""}
                      onChange={(e) => handleOverrideChange(`${slot.id}_minSizeBytes`, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${slot.id}-max`} className="text-xs">
                      Max (KB)
                    </Label>
                    <Input
                      id={`${slot.id}-max`}
                      type="number"
                      placeholder={String(Math.round(slot.maxSizeBytes / 1024))}
                      value={overrides[`${slot.id}_maxSizeBytes`] ?? ""}
                      onChange={(e) => handleOverrideChange(`${slot.id}_maxSizeBytes`, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <ProgressIndicator state={state} percent={percent} />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button className="w-full" size="lg" disabled={!hasAnyFile || isBusy} onClick={handleSubmit}>
            Process & Download Package
          </Button>
        </div>
      )}

      <div className="mt-10 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Sources (last checked {preset.lastVerified})</p>
        {preset.sources.length > 0 ? (
          <ul className="mt-1.5 space-y-1">
            {preset.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5">Enter your own portal&apos;s stated requirements above.</p>
        )}
        <p className="mt-2">
          Requirements can change — always confirm against the current official notification
          before submitting.
        </p>
      </div>
    </div>
  );
}
