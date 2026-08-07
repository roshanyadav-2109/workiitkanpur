import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAllArticles } from "@/lib/articles";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://oppepractice.iitmbsdegree.in";

/**
 * A curated primary index: the home page, the subjects hub, each active
 * subject, the leaderboard, and contact. Thin coming-soon subjects and articles
 * stay out so crawlers can focus on useful candidates for search sitelinks.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/app/subjects`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // One entry per active subject. Guarded so a build without DB access still
  // ships the static routes.
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("subjects")
      .select("id, slug")
      .eq("is_active", true);
    const activeSubjects = data ?? [];
    for (const s of activeSubjects) {
      entries.push({
        url: `${SITE_URL}/app/subjects/${s.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    const subjectIds = activeSubjects.map((subject) => subject.id);
    if (subjectIds.length > 0) {
      const { data: questions } = await supabase
        .from("questions")
        .select("id")
        .in("subject_id", subjectIds)
        .eq("practice_only", true);
      for (const question of questions ?? []) {
        entries.push({
          url: `${SITE_URL}/app/questions/${question.id}`,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    /* subjects unavailable — the home + subjects routes are still valid */
  }

  entries.push({
    url: `${SITE_URL}/leaderboard`,
    changeFrequency: "weekly",
    priority: 0.7,
  });

  for (const article of listAllArticles()) {
    entries.push({
      url: `${SITE_URL}/app/subjects/${article.subject}/articles/${article.slug}`,
      ...(article.date ? { lastModified: article.date } : {}),
      changeFrequency: "monthly",
      priority: 0.65,
    });
  }

  for (const page of [
    { path: "/contact", priority: 0.5 },
    { path: "/login", priority: 0.45 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ]) {
    entries.push({
      url: `${SITE_URL}${page.path}`,
      changeFrequency: "monthly",
      priority: page.priority,
    });
  }

  return entries;
}
