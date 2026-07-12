import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQuestionsForSubject, getSubjectBySlug } from "@/lib/queries";
import { buildSetsForSubject } from "@/lib/test-series";
import { TestRunner } from "@/components/test/test-runner";

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

  const questions = await getQuestionsForSubject(subject.id);
  const set = buildSetsForSubject(questions).find((s) => s.id === setId);
  if (!set || !set.available) notFound();

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
    <TestRunner
      slug={slug}
      setName={set.name}
      durationSeconds={set.durationSeconds}
      sections={sections}
      environment={environment}
    />
  );
}
