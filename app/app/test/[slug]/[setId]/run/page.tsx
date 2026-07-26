import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getCurrentUser,
  getQuestionsForRun,
  getSubjectBySlug,
  getTestSets,
} from "@/lib/queries";
import { extractSqlBlock } from "@/lib/sql";
import { getSubjectResources } from "@/lib/subject-content";
import { startTestAttempt } from "@/lib/test-actions";
import { TestRunner } from "@/components/test/test-runner";
import { TestDeviceGuard } from "@/components/test/device-guard";

export const metadata: Metadata = { title: "Test in progress" };

export default async function RunPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; setId: string }>;
  searchParams: Promise<{ env?: string }>;
}) {
  const { slug, setId } = await params;
  const { env } = await searchParams;
  const environment = env === "exam" ? "exam" : "learning";
  const subject = await getSubjectBySlug(slug);
  if (!subject || !subject.is_active) notFound();

  // The paper is graded and stored server-side, so it needs a signed-in learner.
  const [user, sets] = await Promise.all([
    getCurrentUser(),
    getTestSets(subject.id),
  ]);
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent(`/app/test/${slug}/${setId}/run?env=${environment}`)}`,
    );

  const set = sets.find((s) => s.id === setId);
  if (!set || !set.available) notFound();

  // Only this paper's questions — not every question in the subject.
  const questions = await getQuestionsForRun(
    set.sections.flatMap((s) => s.questionIds),
  );

  // Open (or resume) the attempt row this paper writes into.
  const started = await startTestAttempt({ slug, setId, environment });
  if ("error" in started) redirect(`/app/subjects/${slug}?error=test-start`);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const sections = set.sections.map((s) => ({
    name: s.name,
    bestOf: s.bestOf ?? null,
    note: s.note ?? null,
    questions: s.questionIds
      .map((id) => byId.get(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map((q) => {
        // SQL is graded in the browser by running this reference query and
        // diffing its result against the learner's, so the paper has to carry
        // it (computed before we strip the solution below). Without it the SQL
        // runtime renders no Submit button and every SQL question scores zero.
        const referenceSql =
          q.kind === "sql" ? extractSqlBlock(q.solution_md) : null;
        // In a timed exam, don't ship the written solution or the MCQ answer
        // key to the browser — they'd be readable in DevTools mid-exam. MCQs
        // are re-graded server-side against the stored key on submit, so the
        // client never needs the answer. Learning mode keeps both so solutions
        // stay available. (Coding hidden-test outputs and the SQL reference
        // still reach the client because grading runs in the browser.)
        const isExam = environment === "exam";
        return {
          id: q.id,
          title: q.title,
          marks: s.marks?.[q.id] ?? null,
          body_md: q.body_md,
          solution_md: isExam ? null : q.solution_md,
          kind: q.kind,
          tests: q.tests,
          mcq_options: q.mcq_options,
          mcq_answer: isExam ? null : q.mcq_answer,
          setup_sql: q.setup_sql,
          starter_code: q.starter_code,
          language: q.language,
          harness: q.harness,
          reference_sql: referenceSql,
        };
      }),
  }));

  return (
    <TestDeviceGuard enforce={environment === "exam"}>
      <TestRunner
        slug={slug}
        resourcesMd={getSubjectResources(slug)}
        attemptId={started.attemptId}
        setName={set.name}
        durationSeconds={set.durationSeconds}
        sections={sections}
        environment={environment}
      />
    </TestDeviceGuard>
  );
}
