import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

/**
 * A simple file-backed article (blog) system, one folder per subject:
 *
 *   content/articles/<subject-slug>/<article-slug>.md
 *
 * Each file starts with a small frontmatter block (title, description, date)
 * followed by the article body in markdown. Adding a new post is just dropping
 * a new .md file — no code change. Loaded server-side only.
 */

export interface ArticleMeta {
  /** Subject slug the article belongs to. */
  subject: string;
  /** Article slug (the filename without .md) — the URL segment. */
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD); used for ordering and display. */
  date: string;
}

export interface Article extends ArticleMeta {
  /** Article body as markdown (no frontmatter, no in-body H1). */
  body: string;
}

const ARTICLES_DIR = join(process.cwd(), "content", "articles");

/** Minimal frontmatter parser: a leading --- … --- block of `key: value`. */
function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) {
      const key = line.slice(0, i).trim();
      const value = line
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      data[key] = value;
    }
  }
  return { data, body: raw.slice(match[0].length) };
}

/** All articles for a subject, newest first. Empty if the subject has none. */
export const listArticles = cache(function listArticles(
  subject: string,
): ArticleMeta[] {
  let files: string[];
  try {
    files = readdirSync(join(ARTICLES_DIR, subject)).filter((f) =>
      f.endsWith(".md"),
    );
  } catch {
    return [];
  }
  const metas = files.map((file) => {
    const raw = readFileSync(join(ARTICLES_DIR, subject, file), "utf8");
    const { data } = parseFrontmatter(raw);
    const slug = file.replace(/\.md$/, "");
    return {
      subject,
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? "",
    };
  });
  // Newest first; undated posts sort last.
  metas.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return metas;
});

/** One full article, or null if it doesn't exist. */
export const getArticle = cache(function getArticle(
  subject: string,
  slug: string,
): Article | null {
  let raw: string;
  try {
    raw = readFileSync(join(ARTICLES_DIR, subject, `${slug}.md`), "utf8");
  } catch {
    return null;
  }
  const { data, body } = parseFrontmatter(raw);
  return {
    subject,
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    body: body.trim(),
  };
});
