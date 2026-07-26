import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
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

/* ── Illustrated article covers ───────────────────────────────────────────── */

function IconCode({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 8 L5 12 L8.5 16 M15.5 8 L19 12 L15.5 16 M13.5 6 L10.5 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconDatabase({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 6 V12 C5 13.7 8.1 15 12 15 C15.9 15 19 13.7 19 12 V6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 12 V18 C5 19.7 8.1 21 12 21 C15.9 21 19 19.7 19 18 V12" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconMonitor({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="7" r="1" fill="currentColor" />
      <path d="M8.5 20 H15.5 M12 16.5 V20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconDoc({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 8 H15.5 M8.5 11.5 H15.5 M8.5 15 H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

type ThemeKey = "python" | "sql" | "database" | "exam" | "default";
const THEMES: Record<
  ThemeKey,
  { bg: string; Icon: (p: { size: number }) => React.ReactElement }
> = {
  python: { bg: "linear-gradient(135deg,#33407e 0%,#1f2a55 100%)", Icon: IconCode },
  sql: { bg: "linear-gradient(135deg,#155e5a 0%,#0c3231 100%)", Icon: IconDatabase },
  database: { bg: "linear-gradient(135deg,#3c2f72 0%,#241a4d 100%)", Icon: IconDatabase },
  exam: { bg: "linear-gradient(135deg,#7a4a1f 0%,#3f2410 100%)", Icon: IconMonitor },
  default: { bg: "linear-gradient(135deg,#6d5ce2 0%,#4a39c0 100%)", Icon: IconDoc },
};

function themeOf(theme?: string): ThemeKey {
  return theme && theme in THEMES ? (theme as ThemeKey) : "default";
}

/** Illustrated cover for an article: a real image when one is set, otherwise a
 *  themed gradient with a topic icon and a faint dot pattern. */
export function ArticleCover({
  meta,
  variant,
}: {
  meta: Pick<ArticleMeta, "image" | "theme">;
  variant: "hero" | "card" | "thumb";
}) {
  const box =
    variant === "hero"
      ? "h-[180px] w-full sm:h-[300px]"
      : variant === "card"
        ? "h-[86px] w-[124px] shrink-0 sm:h-[96px] sm:w-[150px]"
        : "h-12 w-16 shrink-0";
  if (meta.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={meta.image} alt="" className={cn("rounded-[3px] object-cover", box)} />
    );
  }
  const { bg, Icon } = THEMES[themeOf(meta.theme)];
  const iconSize = variant === "hero" ? 66 : variant === "card" ? 30 : 18;
  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden rounded-[3px]", box)}
      style={{ backgroundImage: bg }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1.5px)",
          backgroundSize: "13px 13px",
        }}
      />
      <span className="relative text-white/85">
        <Icon size={iconSize} />
      </span>
    </div>
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
          <ArticleCover meta={a} variant="card" />

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
      {/* Cover — a real image if set, else a themed illustration, after the title. */}
      <div className="mt-6">
        <ArticleCover meta={article} variant="hero" />
      </div>
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
            <ArticleCover meta={a} variant="thumb" />
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
