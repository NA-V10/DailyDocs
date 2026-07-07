import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PortalPresetsBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium">Applying to Passport Seva, UPSC, SSC, or an exam portal?</p>
            <p className="text-sm text-muted-foreground">
              Upload once — we compress, resize, and package everything to that portal&apos;s exact
              requirements.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/portal-presets">
            Browse portal presets
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
