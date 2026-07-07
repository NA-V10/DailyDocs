import Link from "next/link";
import { TOOLS } from "@/lib/tools-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ToolGrid() {
  return (
    <section id="tools" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          All the tools you need
        </h2>
        <p className="mt-2 text-muted-foreground">
          Pick a tool to get started — no account required.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const content = (
            <div
              className={cn(
                "flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all",
                tool.available
                  ? "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  : "opacity-60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                {!tool.available && (
                  <Badge variant="secondary" className="text-[10px]">
                    Soon
                  </Badge>
                )}
              </div>
              <div>
                <p className="font-medium">{tool.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{tool.shortDescription}</p>
              </div>
            </div>
          );

          if (!tool.available) {
            return (
              <div key={tool.slug} aria-disabled="true">
                {content}
              </div>
            );
          }

          return (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="block h-full">
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
