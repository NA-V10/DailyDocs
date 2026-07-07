import Link from "next/link";
import { ArrowLeft, Lock, Trash2, Zap, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ToolLayoutProps {
  icon: LucideIcon;
  name: string;
  description: string;
  children: React.ReactNode;
}

const TRUST_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: Lock, label: "Private processing" },
  { icon: Trash2, label: "Auto delete" },
  { icon: Zap, label: "Fast downloads" },
  { icon: Smartphone, label: "Works on mobile" },
];

export function ToolLayout({ icon: Icon, name, description, children }: ToolLayoutProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All tools
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
      </div>

      {children}

      <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        {TRUST_ITEMS.map(({ icon: TrustIcon, label }) => (
          <li key={label} className="flex items-center gap-1.5">
            <TrustIcon className="size-3.5" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
