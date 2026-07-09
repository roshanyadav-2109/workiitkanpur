import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCurrentUser,
  getQuestionsForSubject,
  getSubjectBySlug,
  getTopicsForSubject,
  getUserAttempts,
} from "@/lib/queries";
import { bestTimeByQuestion, statusByQuestion } from "@/lib/metrics";
import { PageHeader } from "@/components/shell/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  QuestionTable,
  type QuestionRow,
} from "@/components/question/question-table";
import type { QuestionStatus } from "@/components/ui/status";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  return { title: subject?.name ?? "Subject" };
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  // is_active is the release switch — inactive subjects are not browsable.
  if (!subject || !subject.is_active) notFound();

  const [topics, questions] = await Promise.all([
    getTopicsForSubject(subject.id),
    getQuestionsForSubject(subject.id),
  ]);

  const user = await getCurrentUser();
  let status = new Map<string, QuestionStatus>();
  let best = new Map<string, number>();
  if (user) {
    const attempts = await getUserAttempts(user.id);
    status = statusByQuestion(attempts);
    best = bestTimeByQuestion(attempts);
  }

  const rows: QuestionRow[] = questions.map((q) => ({
    id: q.id,
    title: q.title,
    topicId: q.topic?.id ?? q.topic_id,
    topicName: q.topic?.name ?? null,
    week: q.topic?.week ?? null,
    difficulty: q.difficulty,
    kind: q.kind,
    tags: q.tags ?? [],
    status: status.get(q.id) ?? "unsolved",
    bestTimeSeconds: best.get(q.id) ?? null,
  }));

  const solvedCount = rows.filter((r) => r.status === "solved").length;

  return (
    <>
      <div className="mb-2">
        <Link
          href="/app/subjects"
          className="text-[13px] text-fg-muted transition-colors hover:text-fg"
        >
          Subjects
        </Link>
      </div>
      <PageHeader
        eyebrow={subject.short_code}
        title={subject.name}
        description={subject.description ?? undefined}
        actions={
          user ? (
            <>
              <span className="text-[13px] tnum text-fg-muted">
                {solvedCount} / {rows.length} solved
              </span>
              <Link
                href="/app/exam"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                Timed exam
              </Link>
            </>
          ) : undefined
        }
      />

      <QuestionTable
        rows={rows}
        topics={topics.map((t) => ({ id: t.id, name: t.name, week: t.week }))}
      />
    </>
  );
}
