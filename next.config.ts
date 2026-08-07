import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Submitted source code is capped at 200 kB in the action and database;
      // leave only enough multipart overhead above that to reject bulk abuse.
      bodySizeLimit: "300kb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
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
    "/llms.txt": ["./content/articles/**/*"],
    "/app/questions/[id]": ["./content/resources/**/*"],
    "/app/test/[slug]/[setId]/run": ["./content/resources/**/*"],
  },
};

export default nextConfig;
