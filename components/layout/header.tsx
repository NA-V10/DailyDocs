import Link from "next/link";
import { FileStack } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FileStack className="size-6 text-primary" aria-hidden="true" />
          DailyDocs
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link
            href="/#tools"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            All tools
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
