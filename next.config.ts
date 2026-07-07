import type { NextConfig } from "next";

// Routes that use pdfjs-dist (directly, or via lib/pdf/remove-blank-pages.ts) —
// all need the file-tracing include below.
const PDFJS_ROUTES = ["/api/tools/pdf-to-images", "/api/tools/pdf-to-word", "/api/tools/portal-preset"];

const nextConfig: NextConfig = {
  // @napi-rs/canvas has a native binary and pdfjs-dist resolves its worker script via a
  // relative path at runtime — both break if Turbopack/webpack bundles them.
  // Loading them as real, unbundled Node modules keeps that resolution intact.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
  // Vercel's deployment file-tracer (@vercel/nft) does static analysis of import/require
  // calls to decide which node_modules files to include in each serverless function. It
  // misses pdfjs-dist's worker script because that's loaded via a dynamically-computed
  // import() path, not a static one — the function fails at runtime with "Cannot find
  // module '.../pdf.worker.mjs'" otherwise. Forcing the whole packages in as an explicit
  // include fixes it. (Confirmed by testing pdf-to-images against the live Vercel deploy.)
  outputFileTracingIncludes: Object.fromEntries(
    PDFJS_ROUTES.map((route) => [
      route,
      ["./node_modules/pdfjs-dist/**/*", "./node_modules/@napi-rs/canvas/**/*"],
    ])
  ),
};

export default nextConfig;
