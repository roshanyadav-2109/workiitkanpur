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
export const SITE_NAME = "IIT Madras BS Degree OPPE Practice";
export const SITE_SHORT_NAME = "OPPE Practice";
export const PUBLISHER_NAME = "IITM BS Community";
export const SITE_TAGLINE =
  "IIT Madras BS Degree OPPE practice with PYQs, coding questions and timed mock tests";
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
  "IIT Madras BS Degree OPPE Practice",
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
    alternateName: [SITE_SHORT_NAME, "oppepractice.iitmbsdegree.in"],
    description: `${SITE_TAGLINE}, instant test-case grading and progress tracking.`,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function organizationNode() {
  return {
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: PUBLISHER_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/iitm-logo-color.svg`,
    description:
      "The independent student community behind IIT Madras BS Degree OPPE Practice, with question banks, PYQs and timed mock tests.",
  };
}

export function webApplicationNode() {
  return {
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#application`,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
    description: `${SITE_TAGLINE} with instant grading in the browser.`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    isAccessibleForFree: true,
    inLanguage: "en-IN",
    provider: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
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
    isAccessibleForFree: true,
    educationalLevel: "IIT Madras BS Degree",
    provider: { "@id": `${SITE_URL}/#organization` },
  };
}

export function learningResourceNode({
  name,
  description,
  path,
  subject,
  difficulty,
  resourceType,
}: {
  name: string;
  description: string;
  path: string;
  subject: string;
  difficulty: string;
  resourceType: string;
}) {
  return {
    "@type": "LearningResource",
    "@id": `${absoluteUrl(path)}#learning-resource`,
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    learningResourceType: resourceType,
    educationalLevel: difficulty,
    about: [subject, "IIT Madras BS Degree OPPE"],
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
