import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getQuestionsForSubject, getSubjectBySlug } from "@/lib/queries";
import { buildSetsForSubject } from "@/lib/test-series";
import { startTestAttempt } from "@/lib/test-actions";
import { TestRunner } from "@/components/test/test-runner";
import { ExamDeviceGuard } from "@/components/exam/device-guard";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent(`/app/test/${slug}/${setId}/run?env=${environment}`)}`,
    );

  const questions = await getQuestionsForSubject(subject.id);
  const set = buildSetsForSubject(questions).find((s) => s.id === setId);
  if (!set || !set.available) notFound();

  // Open (or resume) the attempt row this paper writes into.
  const started = await startTestAttempt({ slug, setId, environment });
  if ("error" in started) redirect(`/app/subjects/${slug}?error=test-start`);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const sections = set.sections.map((s) => ({
    name: s.name,
    questions: s.questionIds
      .map((id) => byId.get(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map((q) => ({
        id: q.id,
        title: q.title,
        body_md: q.body_md,
        solution_md: q.solution_md,
        kind: q.kind,
        tests: q.tests,
        mcq_options: q.mcq_options,
        mcq_answer: q.mcq_answer,
        setup_sql: q.setup_sql,
        starter_code: q.starter_code,
        language: q.language,
      })),
  }));

  return (
    <ExamDeviceGuard>
      <TestRunner
        slug={slug}
        attemptId={started.attemptId}
        setName={set.name}
        durationSeconds={set.durationSeconds}
        sections={sections}
        environment={environment}
      />
    </ExamDeviceGuard>
  );
}
