import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { listArticles } from "@/lib/articles";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://oppepractice.iitmbsdegree.in";

/**
 * Sitemap for crawlers: the public marketing/entry routes plus one entry per
 * live subject. Auth-gated pages (progress, settings, individual questions)
 * are deliberately left out — they redirect to /login and hold no public
 * content to index.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/app/subjects", priority: 0.9 },
    { path: "/leaderboard", priority: 0.7 },
    { path: "/login", priority: 0.5 },
    { path: "/contact", priority: 0.4 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: r.priority,
  }));

  // A URL for every subject — live or not — plus each subject's articles.
  // Subjects that aren't live still have a crawlable landing page, so they
  // belong in the sitemap. Guarded so a build without DB access still ships the
  // static routes.
  const subjectSlugs: string[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("subjects").select("slug");
    for (const s of data ?? []) subjectSlugs.push(s.slug);
  } catch {
    /* subjects unavailable — static routes are enough for a valid sitemap */
  }

  for (const slug of subjectSlugs) {
    entries.push({
      url: `${SITE_URL}/app/subjects/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const article of listArticles(slug)) {
      entries.push({
        url: `${SITE_URL}/app/subjects/${slug}/articles/${article.slug}`,
        lastModified: article.date ? new Date(article.date) : now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
