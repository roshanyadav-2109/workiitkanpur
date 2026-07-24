import Link from "next/link";
import { Markdown } from "@/components/markdown";
import type { SubjectContent } from "@/lib/subject-content";
import type { Article, ArticleMeta } from "@/lib/articles";

/** The Syllabus section — intro + OPPE syllabus tables, from markdown. Full
 *  width so the tables use the whole column rather than the reading measure. */
export function SyllabusPanel({ content }: { content: SubjectContent }) {
  return <Markdown className="prose-wide">{content.syllabus}</Markdown>;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format an ISO date (YYYY-MM-DD) as "18 Jul 2026" without Date parsing. */
function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** The Articles section — a list of post cards (a blog index for the subject). */
export function ArticlesList({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) {
    return (
      <p className="text-[14px] text-fg-muted">
        Guides and articles for this subject are on the way.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {articles.map((a) => (
        <Link
          key={a.slug}
          href={`/app/subjects/${a.subject}/articles/${a.slug}`}
          className="block rounded-[8px] border border-hairline p-4 transition-colors hover:border-[#3d3d3d] hover:bg-surface"
        >
          {a.date && (
            <div className="mb-1 text-[12px] text-fg-faint">
              {formatDate(a.date)}
            </div>
          )}
          <h3 className="text-[16px] font-semibold leading-snug text-fg">
            {a.title}
          </h3>
          {a.description && (
            <p className="mt-1 text-[13.5px] leading-relaxed text-fg-muted">
              {a.description}
            </p>
          )}
          <span className="mt-2 inline-block text-[13px] font-medium text-accent">
            Read article →
          </span>
        </Link>
      ))}
    </div>
  );
}

/** A full article, rendered on its own page. */
export function ArticleView({ article }: { article: Article }) {
  return (
    <article>
      <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[30px]">
        {article.title}
      </h1>
      {article.date && (
        <div className="mt-2 text-[13px] text-fg-muted">
          {formatDate(article.date)}
        </div>
      )}
      <div className="mt-6">
        <Markdown>{article.body}</Markdown>
      </div>
    </article>
  );
}
