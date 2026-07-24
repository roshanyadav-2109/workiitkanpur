import { readFileSync } from "node:fs";
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
