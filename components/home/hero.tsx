import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        No sign-up. No file storage.
      </div>
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
        The fastest way to work with your documents.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-balance">
        Compress, merge, split, convert and edit PDFs and images in seconds. Private. Secure.
        Free.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="#tools">
            Upload File
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="#tools">Explore Tools</Link>
        </Button>
      </div>
    </section>
  );
}
