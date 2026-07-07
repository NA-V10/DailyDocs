import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @napi-rs/canvas has a native binary and pdfjs-dist resolves its worker script via a
  // relative path at runtime — both break if Turbopack/webpack bundles them.
  // Loading them as real, unbundled Node modules keeps that resolution intact.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
};

export default nextConfig;
