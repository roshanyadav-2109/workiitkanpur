import type { Metadata } from "next";

/**
 * One source of truth for SEO across the site.
 *
 * Every public page builds its metadata with `pageMetadata(...)` so titles,
 * descriptions, canonical URLs, Open Graph and Twitter cards, and keywords all
 * come out consistent. Structured data (JSON-LD) is assembled from the small
 * builders below and rendered through <JsonLd>.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://oppepractice.iitmbsdegree.in";
export const SITE_NAME = "IITM BS Community";
export const SITE_TAGLINE = "OPPE Practice for the IIT Madras BS Degree";
export const SITE_LOCALE = "en_IN";

/** Absolute URL for a path, with a clean canonical for the root. */
export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Keyword base carried by every page. Page-specific keywords are prepended so
 * the most relevant terms lead. Aimed at the real search intent around the IIT
 * Madras BS Degree OPPE — practice, quizzes, previous-year questions and mocks.
 */
export const BASE_KEYWORDS = [
  "IITM BS Community",
  "IIT Madras BS Degree",
  "IITM BS Degree",
  "IIT Madras online degree",
  "IITM BS quiz",
  "IITM BS practice",
  "IITM BS Degree practice",
  "OPPE",
  "OPPE practice",
  "OPPE quiz",
  "OPPE 1",
  "OPPE 2",
  "OPPE previous year questions",
  "OPPE PYQ",
  "PYQ",
  "quiz practice",
  "IIT Madras BS quiz practice",
  "programming quiz",
  "coding practice",
  "IITM BS mock test",
];

interface PageSeo {
  /** Page title (the site template appends the brand automatically). */
  title: string;
  description: string;
  /** Canonical path, e.g. "/leaderboard". */
  path: string;
  /** Extra, page-specific keywords, placed before the base set. */
  keywords?: string[];
  /** Set false for thin/auth pages that shouldn't be indexed. */
  index?: boolean;
}

/** Build a complete, consistent Metadata object for a page. */
export function pageMetadata({
  title,
  description,
  path,
  keywords = [],
  index = true,
}: PageSeo): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    keywords: [...keywords, ...BASE_KEYWORDS],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: SITE_LOCALE,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}

/* ── JSON-LD builders ─────────────────────────────────────────────────────── */

/** Wrap nodes into a single @graph document. */
export function jsonLdGraph(nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: `${SITE_TAGLINE} — previous-year questions and timed mocks with in-browser grading.`,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function organizationNode() {
  return {
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/iitm-logo-color.svg`,
    description:
      "A practice platform for the IIT Madras Online BS Degree OPPE exams — quizzes, previous-year questions and timed mock tests.",
  };
}

export function breadcrumbNode(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function courseNode({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@type": "Course",
    "@id": `${absoluteUrl(path)}#course`,
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: "en-IN",
    provider: { "@id": `${SITE_URL}/#organization` },
  };
}

export function itemListNode(items: { name: string; path: string }[]) {
  return {
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.path),
    })),
  };
}

export function faqNode(items: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}
