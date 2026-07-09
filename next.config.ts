import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next does not pick up an unrelated parent lockfile.
  turbopack: {
    root: path.resolve(),
  },
};

export default nextConfig;
