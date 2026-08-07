import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubjectBySlug } from "@/lib/queries";
import { getArticle, listAllArticles } from "@/lib/articles";
import {
  ArticleView,
  SuggestedArticles,
} from "@/components/curriculum/subject-content";
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  breadcrumbNode,
  absoluteUrl,
  SITE_URL,
  PUBLISHER_NAME,
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

  // Suggested reading — every other article, same subject first, then the rest.
  const suggested = listAllArticles()
    .filter((a) => !(a.subject === slug && a.slug === articleSlug))
    .sort((a, b) => (a.subject === slug ? 0 : 1) - (b.subject === slug ? 0 : 1))
    .slice(0, 6);

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
      author: { "@type": "Organization", name: PUBLISHER_NAME, url: SITE_URL },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ]);

  return (
    <div className="mx-auto max-w-[1120px]">
      <JsonLd data={jsonLd} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <ArticleView article={article} subjectName={subjectName} />
        </div>
        <aside className="min-w-0">
          <div className="lg:sticky lg:top-[72px]">
            <SuggestedArticles articles={suggested} />
          </div>
        </aside>
      </div>
    </div>
  );
}
