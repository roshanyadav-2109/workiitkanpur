import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next does not pick up an unrelated parent lockfile.
  turbopack: {
    root: path.resolve(),
  },
  // The subject and article pages (and the sitemap) read markdown from content/
  // at runtime; make sure those files are bundled into each route's function.
  outputFileTracingIncludes: {
    "/app/subjects/[slug]": [
      "./content/subjects/**/*",
      "./content/articles/**/*",
    ],
    "/app/subjects/[slug]/articles/[articleSlug]": ["./content/articles/**/*"],
    "/sitemap.xml": ["./content/articles/**/*"],
  },
};

export default nextConfig;
