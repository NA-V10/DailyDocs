import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DailyDocs — The fastest way to work with your documents",
    template: "%s | DailyDocs",
  },
  description:
    "Compress, merge, split, convert and edit PDFs and images in seconds. Private, secure, and free — no account required.",
  openGraph: {
    title: "DailyDocs — The fastest way to work with your documents",
    description:
      "Compress, merge, split, convert and edit PDFs and images in seconds. Private, secure, and free.",
    type: "website",
    url: siteUrl,
    siteName: "DailyDocs",
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyDocs — The fastest way to work with your documents",
    description:
      "Compress, merge, split, convert and edit PDFs and images in seconds. Private, secure, and free.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
