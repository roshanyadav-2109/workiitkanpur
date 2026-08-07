import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://oppepractice.iitmbsdegree.in";

// Internal paths no crawler needs.
const DISALLOW = [
  "/api/",
  "/auth/",
  "/app/settings",
  "/app/progress",
  "/app/test/",
  "/runtime-check",
  "/style-guide",
];

// The major AI / answer-engine crawlers, listed explicitly so they are clearly
// welcome (AEO/GEO): OpenAI, Anthropic, Perplexity, Google Gemini, Apple, Meta,
// Amazon, Common Crawl and others. They get the same access as everyone else.
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "CCBot",
  "Bytespider",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "cohere-ai",
  "YouBot",
  "Diffbot",
];

/** Let every crawler in except API/auth internals, private progress data,
 *  in-progress tests and development-only utilities. Login stays indexable. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_AGENTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
