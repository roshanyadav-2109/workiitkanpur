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

/** A violet placeholder frame shown when an article has no cover image. */
function ArticleFrame() {
  return (
    <div className="grid h-[86px] w-[124px] shrink-0 place-items-center overflow-hidden rounded-[8px] bg-gradient-to-br from-[#6d5ce2] via-[#5a48d6] to-[#4a39c0] sm:h-[92px] sm:w-[140px]">
      {/* Simple "article" glyph — a few text lines on a card. */}
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="3.5" width="16" height="17" rx="2" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.4" />
        <path d="M7.5 8 H16.5 M7.5 11 H16.5 M7.5 14 H13" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** The Articles section — a blog index. Each row: a violet frame + date on the
 *  left, the title & description on the right, and a Read-article button in the
 *  bottom-right corner. No boxed cards. */
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
          className="group flex gap-4 py-5 sm:gap-5"
        >
          {/* Left — frame + publish date beside it */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <ArticleFrame />
            {a.date && (
              <span className="text-[12px] text-fg-faint">{formatDate(a.date)}</span>
            )}
          </div>

          {/* Right — title, description, and the read button at the bottom */}
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="text-[16px] font-semibold leading-snug text-fg transition-colors group-hover:text-accent sm:text-[17px]">
              {a.title}
            </h3>
            {a.description && (
              <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-fg-muted">
                {a.description}
              </p>
            )}
            <div className="mt-auto flex justify-end pt-3">
              <span className="inline-flex items-center gap-1 rounded-[6px] border border-accent-border/50 px-3 py-1.5 text-[12.5px] font-medium text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                Read article →
              </span>
            </div>
          </div>
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
