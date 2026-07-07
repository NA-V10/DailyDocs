import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PORTAL_PRESETS, getPortalPreset } from "@/lib/portal-presets/presets-config";
import { PortalPresetForm } from "./portal-preset-form";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PORTAL_PRESETS.map((preset) => ({ slug: preset.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const preset = getPortalPreset(slug);
  if (!preset) return {};
  return {
    title: preset.name,
    description: preset.description,
  };
}

export default async function PortalPresetPage({ params }: PageProps) {
  const { slug } = await params;
  const preset = getPortalPreset(slug);

  if (!preset) {
    notFound();
  }

  return <PortalPresetForm preset={preset} />;
}
