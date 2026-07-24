import { Markdown } from "@/components/markdown";
import type { SubjectContent } from "@/lib/subject-content";

/** The Syllabus section — intro + OPPE syllabus tables, from markdown. */
export function SyllabusPanel({ content }: { content: SubjectContent }) {
  return <Markdown>{content.syllabus}</Markdown>;
}

/** The Articles section — the subject's long-form OPPE guide. */
export function ArticlePanel({ content }: { content: SubjectContent }) {
  return (
    <article>
      <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-fg sm:text-[26px]">
        {content.article.title}
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-fg-muted">
        {content.article.description}
      </p>
      <div className="mt-5">
        <Markdown>{content.article.body}</Markdown>
      </div>
    </article>
  );
}
