import { Lock, Trash2, Zap, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Lock,
    title: "Private Processing",
    description: "Files are processed in memory and never written to disk.",
  },
  {
    icon: Trash2,
    title: "Auto Delete",
    description: "Nothing is stored on our servers, ever.",
  },
  {
    icon: Zap,
    title: "Fast Downloads",
    description: "Most files process in well under a second.",
  },
  {
    icon: Smartphone,
    title: "Works on Mobile",
    description: "Full functionality on any device.",
  },
];

export function TrustBadges() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col items-center text-center sm:items-start sm:text-left"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <p className="font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
