import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import type { PortalPreset } from "@/lib/portal-presets/types";

interface PresetCardProps {
  preset: PortalPreset;
}

export function PresetCard({ preset }: PresetCardProps) {
  return (
    <Link href={`/portal-presets/${preset.slug}`} className="block h-full">
      <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <FileCheck2 className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-medium">{preset.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{preset.agency}</p>
        </div>
      </div>
    </Link>
  );
}
