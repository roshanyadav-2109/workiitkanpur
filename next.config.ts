import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next does not pick up an unrelated parent lockfile.
  turbopack: {
    root: path.resolve(),
  },
  // The subject pages read their syllabus/article markdown from content/ at
  // runtime; make sure those files are bundled into the route's function.
  outputFileTracingIncludes: {
    "/app/subjects/[slug]": ["./content/subjects/**/*"],
  },
};

export default nextConfig;
