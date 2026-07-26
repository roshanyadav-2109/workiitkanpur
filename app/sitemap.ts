import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://oppepractice.iitmbsdegree.in";

/**
 * A curated primary index: the home page, the subjects hub, each subject, and
 * the leaderboard. Articles are deliberately left out — they stay crawlable
 * through internal links (so Google and AI crawlers still read them), but the
 * sitemap keeps to the main pages so the index stays clean.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/app/subjects`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // One entry per subject (live or coming soon). Guarded so a build without DB
  // access still ships the static routes.
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("subjects").select("slug");
    for (const s of data ?? []) {
      entries.push({
        url: `${SITE_URL}/app/subjects/${s.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    /* subjects unavailable — the home + subjects routes are still valid */
  }

  entries.push({
    url: `${SITE_URL}/leaderboard`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  });

  return entries;
}
