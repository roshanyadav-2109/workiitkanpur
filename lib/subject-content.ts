import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

/**
 * Per-subject editorial content: the OPPE syllabus (GFM-markdown tables) and a
 * long-form, SEO-oriented article. Rendered on each subject page's Syllabus and
 * Articles sections, and inlined on the "coming soon" landing so those pages
 * carry real, rankable content — not a thin placeholder.
 *
 * The prose lives as raw markdown under content/subjects/<slug>.md (syllabus
 * first, an <!--ARTICLE--> marker, then the article body). Keeping it out of TS
 * means the inline code and backticks in the articles need no escaping. Loaded
 * server-side only (subject pages are server components).
 */

export interface SubjectArticle {
  /** Article title — rendered as the heading above the body. */
  title: string;
  /** One-line summary. */
  description: string;
  /** Article body as markdown (starts at H2 — no in-body H1). */
  body: string;
}

export interface SubjectContent {
  /** Syllabus section: intro + one or more GFM-markdown tables. */
  syllabus: string;
  /** Long-form article for the Articles section. */
  article: SubjectArticle;
}

// Title + description per subject (the parts that don't belong in the markdown).
const META: Record<string, { title: string; description: string }> = {
  python: {
    title: "Programming in Python OPPE: Syllabus, Preparation & Common Doubts",
    description:
      "A practical guide to the IITM BS Programming in Python OPPE 1 and OPPE 2 — syllabus, allowed modules, grading with hidden test cases, and exam-day strategy.",
  },
  dbms: {
    title: "DBMS OPPE: Syllabus, SQL Preparation & Common Doubts",
    description:
      "Clear the IITM BS Database Management Systems OPPE — exam pattern, the SQL that's actually tested, the psycopg2/PostgreSQL question, and exam-day strategy.",
  },
  pdsa: {
    title: "PDSA OPPE: Syllabus, Algorithms to Master & Common Doubts",
    description:
      "A practical guide to the IIT Madras BS PDSA (Programming, Data Structures and Algorithms using Python) OPPE — syllabus, key algorithms, complexity and exam tips.",
  },
  java: {
    title: "Java (Programming Concepts using Java) OPPE: Syllabus & Preparation",
    description:
      "A practical guide to the IIT Madras BS Programming Concepts using Java (BSCS2005) OPPE — syllabus, the OOP concepts tested, grading, and exam-day tips.",
  },
  c: {
    title: "Introduction to C Programming OPPE: Syllabus & Preparation",
    description:
      "A practical guide to the IIT Madras BS Introduction to C Programming OPPE — structure, syllabus, pointers and strings, and exam-day strategy.",
  },
  syscmd: {
    title: "System Commands OPPE: Syllabus, grep/sed/awk & Preparation",
    description:
      "A practical guide to clearing the IIT Madras BS System Commands online proctored programming exam — grep, sed, awk, shell scripting and exam-day tips.",
  },
  linux: {
    title: "Introduction to Linux & Programming OPPE: Syllabus & Preparation",
    description:
      "A practical guide to the CS1102 Introduction to the Linux Shell OPPE in the IIT Madras BS Electronic Systems degree — syllabus, exam format, and preparation.",
  },
  "embedded-c": {
    title: "Embedded C Programming OPPE: Syllabus & Preparation Guide",
    description:
      "A practical guide to preparing for the IIT Madras BS Electronic Systems Embedded C (CS2101) programming exam — syllabus, key peripherals, and preparation.",
  },
};

const CONTENT_DIR = join(process.cwd(), "content", "subjects");
const ARTICLE_MARKER = "<!--ARTICLE-->";

export const getSubjectContent = cache(function getSubjectContent(
  slug: string,
): SubjectContent | null {
  const meta = META[slug];
  if (!meta) return null;
  let raw: string;
  try {
    raw = readFileSync(join(CONTENT_DIR, `${slug}.md`), "utf8");
  } catch {
    return null;
  }
  const idx = raw.indexOf(ARTICLE_MARKER);
  const syllabus = (idx >= 0 ? raw.slice(0, idx) : raw).trim();
  const body = idx >= 0 ? raw.slice(idx + ARTICLE_MARKER.length).trim() : "";
  return {
    syllabus,
    article: { title: meta.title, description: meta.description, body },
  };
});
