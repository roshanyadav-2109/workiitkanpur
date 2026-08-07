import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

/**
 * A subject's syllabus content — the OPPE syllabus as GFM-markdown tables.
 * Stored as raw markdown under content/subjects/<slug>.md so the inline code in
 * the tables needs no escaping. Articles live separately (see lib/articles.ts).
 * Loaded server-side only (subject pages are server components).
 */

export interface SubjectContent {
  /** Syllabus section: intro + one or more GFM-markdown tables. */
  syllabus: string;
}

const CONTENT_DIR = join(process.cwd(), "content", "subjects");
const RESOURCES_DIR = join(process.cwd(), "content", "resources");

export const hasSubjectContent = cache((slug: string) =>
  existsSync(join(CONTENT_DIR, `${slug}.md`)),
);

export const hasSubjectResources = cache((slug: string) =>
  existsSync(join(RESOURCES_DIR, `${slug}.md`)),
);

export const getSubjectContent = cache(function getSubjectContent(
  slug: string,
): SubjectContent | null {
  try {
    const raw = readFileSync(join(CONTENT_DIR, `${slug}.md`), "utf8").trim();
    return raw ? { syllabus: raw } : null;
  } catch {
    return null;
  }
});

/** A subject's Resources markdown (course info, faculty, links), or null. */
export const getSubjectResources = cache(function getSubjectResources(
  slug: string,
): string | null {
  try {
    const raw = readFileSync(join(RESOURCES_DIR, `${slug}.md`), "utf8").trim();
    return raw || null;
  } catch {
    return null;
  }
});
