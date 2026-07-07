import { Hero } from "@/components/home/hero";
import { TrustBadges } from "@/components/home/trust-badges";
import { ToolGrid } from "@/components/home/tool-grid";
import { PortalPresetsBanner } from "@/components/home/portal-presets-banner";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="py-6 sm:py-8">
        <PortalPresetsBanner />
      </div>
      <TrustBadges />
      <ToolGrid />
    </>
  );
}
