import { NextRequest } from "next/server";
import { getPortalPreset } from "@/lib/portal-presets/presets-config";
import { processSlotUpload } from "@/lib/portal-presets/process-package";
import type { DocumentSlot } from "@/lib/portal-presets/types";
import { fileResponse, errorResponse } from "@/lib/api-response";
import { createZip } from "@/lib/zip";

export const runtime = "nodejs";

function applyCustomOverrides(slot: DocumentSlot, formData: FormData): DocumentSlot {
  const maxRaw = formData.get(`${slot.id}_maxSizeBytes`);
  const minRaw = formData.get(`${slot.id}_minSizeBytes`);
  const widthRaw = formData.get(`${slot.id}_width`);
  const heightRaw = formData.get(`${slot.id}_height`);

  const maxKb = typeof maxRaw === "string" && maxRaw ? Number(maxRaw) : undefined;
  const minKb = typeof minRaw === "string" && minRaw ? Number(minRaw) : undefined;
  const width = typeof widthRaw === "string" && widthRaw ? Number(widthRaw) : undefined;
  const height = typeof heightRaw === "string" && heightRaw ? Number(heightRaw) : undefined;

  return {
    ...slot,
    maxSizeBytes: maxKb && Number.isFinite(maxKb) && maxKb > 0 ? maxKb * 1024 : slot.maxSizeBytes,
    minSizeBytes: minKb && Number.isFinite(minKb) && minKb >= 0 ? minKb * 1024 : slot.minSizeBytes,
    targetDimensions:
      width && height && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
        ? { width, height }
        : slot.targetDimensions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const presetSlug = formData.get("preset");

    if (typeof presetSlug !== "string") {
      return errorResponse("Choose a portal preset.");
    }

    const preset = getPortalPreset(presetSlug);
    if (!preset) {
      return errorResponse("Unknown portal preset.");
    }

    const zipEntries: { name: string; data: Buffer }[] = [];
    const manifest: { fileName: string; meetsRequirement: boolean; note: string }[] = [];
    let anyFileProcessed = false;

    for (const rawSlot of preset.slots) {
      const slot = preset.isCustom ? applyCustomOverrides(rawSlot, formData) : rawSlot;
      const files = formData.getAll(slot.id).filter((f): f is File => f instanceof File);

      if (files.length === 0) {
        if (slot.required) {
          return errorResponse(`${slot.label} is required for ${preset.name}.`);
        }
        continue;
      }

      const filesToProcess = slot.multiple ? files : files.slice(0, 1);

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const data = Buffer.from(await file.arrayBuffer());

        const processed = await processSlotUpload(
          { fileName: file.name, data, mimeType: file.type },
          slot,
          i
        );

        zipEntries.push({ name: processed.fileName, data: processed.data });
        manifest.push({
          fileName: processed.fileName,
          meetsRequirement: processed.meetsRequirement,
          note: processed.note,
        });
        anyFileProcessed = true;
      }
    }

    if (!anyFileProcessed) {
      return errorResponse("Upload at least one document.");
    }

    const manifestLines = [
      `DailyDocs — ${preset.name} document package`,
      `Generated: ${new Date().toISOString()}`,
      "",
      ...manifest.map((entry) => `${entry.meetsRequirement ? "[OK]" : "[CHECK]"} ${entry.fileName} — ${entry.note}`),
      "",
      "Requirements were compiled from official/current sources but portals update their",
      "notifications periodically — always confirm against the current official notification",
      "before submitting.",
    ];
    zipEntries.push({ name: "requirements-check.txt", data: Buffer.from(manifestLines.join("\n")) });

    const zipBuffer = await createZip(zipEntries);
    const response = fileResponse(zipBuffer, `${preset.slug}-package.zip`, "application/zip");
    response.headers.set("X-Manifest", encodeURIComponent(JSON.stringify(manifest)));
    return response;
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to process the document package.",
      500
    );
  }
}
