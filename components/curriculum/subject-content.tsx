import Link from "next/link";
import { Markdown } from "@/components/markdown";
import type { SubjectContent } from "@/lib/subject-content";
import type { Article, ArticleMeta } from "@/lib/articles";

/** The Syllabus section — intro + OPPE syllabus tables, from markdown. Full
 *  width so the tables use the whole column rather than the reading measure. */
export function SyllabusPanel({ content }: { content: SubjectContent }) {
  return <Markdown className="prose-wide">{content.syllabus}</Markdown>;
}

/** The Resources section — course info, faculty and links, from markdown. */
export function ResourcesPanel({ markdown }: { markdown: string }) {
  return <Markdown className="prose-wide">{markdown}</Markdown>;
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

/** A plain violet placeholder frame shown when an article has no cover image. */
function ArticleFrame() {
  return (
    <div className="h-[86px] w-[124px] shrink-0 rounded-[3px] bg-gradient-to-br from-[#6d5ce2] via-[#5a48d6] to-[#4a39c0] sm:h-[96px] sm:w-[150px]" />
  );
}

/** The Articles section — a blog index. Each row: a violet frame on the left,
 *  the title & description on the right, then a footer with the publish date on
 *  the left and a coloured Read-article button on the right. No boxed cards. */
export function ArticlesList({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) {
    return (
      <p className="text-[14px] text-fg-muted">
        Guides and articles for this subject are on the way.
      </p>
    );
  }
  return (
    <div className="divide-y divide-hairline">
      {articles.map((a) => (
        <Link
          key={a.slug}
          href={`/app/subjects/${a.subject}/articles/${a.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex gap-4 py-5 sm:gap-5"
        >
          <ArticleFrame />

          {/* Right — title, description, then date + read button at the bottom */}
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="text-[16px] font-semibold leading-snug text-fg transition-colors group-hover:text-accent sm:text-[17px]">
              {a.title}
            </h3>
            {a.description && (
              <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-fg-muted">
                {a.description}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
              <span className="text-[12px] text-fg-faint">
                {a.date ? formatDate(a.date) : ""}
              </span>
              <span className="inline-flex items-center gap-1 rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-3 py-1.5 text-[12.5px] font-normal text-white ring-1 ring-inset ring-white/20 transition-colors hover:from-[#7a6ae8] hover:to-[#6455dd]">
                Read article →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** A full article, rendered on its own page — newspaper style. */
export function ArticleView({
  article,
  subjectName,
}: {
  article: Article;
  subjectName: string;
}) {
  return (
    <article>
      <h1 className="text-[27px] font-bold leading-[1.12] tracking-[-0.02em] text-fg sm:text-[36px]">
        {article.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-muted">
        <span className="font-medium text-accent">{subjectName}</span>
        {article.date && (
          <>
            <span aria-hidden>·</span>
            <span>{formatDate(article.date)}</span>
          </>
        )}
      </div>
      {/* Hero image frame — violet placeholder (no cover image yet), after the title. */}
      <div className="mt-6 h-[180px] w-full rounded-[3px] bg-gradient-to-br from-[#6d5ce2] via-[#5a48d6] to-[#4a39c0] sm:h-[300px]" />
      <div className="mt-7">
        <Markdown className="prose-article">{article.body}</Markdown>
      </div>
    </article>
  );
}

/** Right-rail block of more articles (from this and other subjects). */
export function SuggestedArticles({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;
  return (
    <div className="rounded-[3px] border border-hairline bg-surface p-5">
      <h2 className="text-[15px] font-bold text-fg">More OPPE guides</h2>
      <div className="mt-4 space-y-4">
        {articles.map((a) => (
          <Link
            key={`${a.subject}/${a.slug}`}
            href={`/app/subjects/${a.subject}/articles/${a.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3"
          >
            <div className="h-12 w-16 shrink-0 rounded-[3px] bg-gradient-to-br from-[#6d5ce2] to-[#5a48d6]" />
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[13.5px] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                {a.title}
              </h3>
              {a.date && (
                <div className="mt-1 text-[11.5px] text-fg-faint">
                  {formatDate(a.date)}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
