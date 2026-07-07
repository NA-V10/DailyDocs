import type { Metadata } from "next";
import { PORTAL_PRESETS } from "@/lib/portal-presets/presets-config";
import { PresetCard } from "@/components/portal-presets/preset-card";

export const metadata: Metadata = {
  title: "Portal Presets",
  description:
    "One-click document packages for Passport Seva, UPSC, SSC, IBPS, RRB, and NTA exams — upload once, get everything compressed and formatted to that portal's requirements.",
};

export default function PortalPresetsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Portal Presets</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Pick where you&apos;re applying. Upload your photo, signature, and documents once — we
          compress, resize, convert, and package everything to that portal&apos;s requirements
          automatically.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PORTAL_PRESETS.map((preset) => (
          <PresetCard key={preset.slug} preset={preset} />
        ))}
      </div>
    </div>
  );
}
