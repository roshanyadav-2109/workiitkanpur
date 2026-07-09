import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAttemptsForQuestion,
  getCurrentUser,
  getNote,
  getQuestionById,
} from "@/lib/queries";
import { bestTimeByQuestion, statusByQuestion } from "@/lib/metrics";
import { Markdown } from "@/components/markdown";
import { Difficulty, Tag } from "@/components/ui/tag";
import { SolutionReveal } from "@/components/question/solution-reveal";
import { QuestionWorkspace } from "@/components/question/question-workspace";
import type { QuestionStatus } from "@/components/ui/status";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getQuestionById(id);
  return { title: ctx?.question.title ?? "Question" };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getQuestionById(id);
  if (!ctx) notFound();
  const { question, subject, topic } = ctx;

  const user = await getCurrentUser();
  let status: QuestionStatus = "unsolved";
  let bestSeconds: number | null = null;
  let note = "";
  if (user) {
    const attempts = await getAttemptsForQuestion(user.id, id);
    status = statusByQuestion(attempts).get(id) ?? "unsolved";
    bestSeconds = bestTimeByQuestion(attempts).get(id) ?? null;
    const existing = await getNote(user.id, id);
    note = existing?.content_md ?? "";
  }

  return (
    <>
      <nav className="mb-3 flex items-center gap-1.5 text-[13px] text-fg-muted">
        <Link
          href="/app/subjects"
          className="transition-colors hover:text-fg"
        >
          Subjects
        </Link>
        <span className="text-fg-faint">/</span>
        <Link
          href={`/app/subjects/${subject.slug}`}
          className="transition-colors hover:text-fg"
        >
          {subject.name}
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-[24px] font-medium leading-tight tracking-[-0.01em]">
          {question.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Difficulty level={question.difficulty} />
          {topic && (
            <span className="text-[13px] text-fg-muted">
              {topic.week != null ? `Week ${topic.week} · ` : ""}
              {topic.name}
            </span>
          )}
          {question.kind !== "coding" && <Tag>{question.kind.toUpperCase()}</Tag>}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.tags.slice(0, 4).map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
        </div>
      </header>

      <QuestionWorkspace
        question={{
          id: question.id,
          kind: question.kind,
          tests: question.tests,
          mcq_options: question.mcq_options,
          mcq_answer: question.mcq_answer,
          setup_sql: question.setup_sql,
        }}
        isAuthed={!!user}
        initialStatus={status}
        initialNote={note}
        initialBestSeconds={bestSeconds}
        bodySlot={<Markdown>{question.body_md}</Markdown>}
        solutionSlot={<SolutionReveal solution={question.solution_md} />}
      />
    </>
  );
}
