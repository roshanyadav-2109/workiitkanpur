import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSubjectBySlug } from "@/lib/queries";
import { getArticle } from "@/lib/articles";
import { ArticleView } from "@/components/curriculum/subject-content";
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  breadcrumbNode,
  absoluteUrl,
  SITE_URL,
  SITE_NAME,
} from "@/lib/seo";

interface Params {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  const article = getArticle(slug, articleSlug);
  const path = `/app/subjects/${slug}/articles/${articleSlug}`;
  if (!article) {
    return pageMetadata({
      title: "Article",
      description: "OPPE guide for the IIT Madras BS Degree.",
      path,
      index: false,
    });
  }
  return pageMetadata({
    title: article.title,
    description: article.description,
    path,
    keywords: [`${slug} OPPE`, "OPPE guide", "OPPE preparation"],
  });
}

export default async function ArticlePage({ params }: Params) {
  const { slug, articleSlug } = await params;
  const article = getArticle(slug, articleSlug);
  if (!article) notFound();

  const subject = await getSubjectBySlug(slug);
  const subjectName = subject?.name ?? slug;
  const path = `/app/subjects/${slug}/articles/${articleSlug}`;

  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Subjects", path: "/app/subjects" },
      { name: subjectName, path: `/app/subjects/${slug}` },
      { name: article.title, path },
    ]),
    {
      "@type": "Article",
      headline: article.title,
      description: article.description,
      ...(article.date
        ? { datePublished: article.date, dateModified: article.date }
        : {}),
      inLanguage: "en-IN",
      url: absoluteUrl(path),
      mainEntityOfPage: absoluteUrl(path),
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ]);

  return (
    <div className="mx-auto max-w-[860px]">
      <JsonLd data={jsonLd} />
      <nav className="mb-6 text-[13px]">
        <Link
          href={`/app/subjects/${slug}`}
          className="text-fg-muted transition-colors hover:text-fg"
        >
          ← {subjectName}
        </Link>
      </nav>
      <ArticleView article={article} />
    </div>
  );
}
