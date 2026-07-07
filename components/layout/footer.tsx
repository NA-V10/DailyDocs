export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <p>&copy; {new Date().getFullYear()} DailyDocs. Files are processed in memory and never stored.</p>
        <p>No account. No tracking of your documents.</p>
      </div>
    </footer>
  );
}
