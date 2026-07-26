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
      "./content/resources/**/*",
    ],
    "/app/subjects/[slug]/articles/[articleSlug]": ["./content/articles/**/*"],
    "/app/questions/[id]": ["./content/resources/**/*"],
    "/app/test/[slug]/[setId]/run": ["./content/resources/**/*"],
  },
};

export default nextConfig;
