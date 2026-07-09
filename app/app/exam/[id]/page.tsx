import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ExamRunner, type ExamQuestion } from "@/components/exam/exam-runner";
import { ExamResults } from "@/components/exam/exam-results";

export const metadata: Metadata = { title: "Exam" };

export default async function ExamSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/exam/${sessionId}`);

  const { data: session } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session || session.user_id !== user.id) notFound();

  if (session.status === "in_progress") {
    const elapsed = Math.floor(
      (Date.now() - new Date(session.started_at).getTime()) / 1000,
    );
    const remaining = Math.max(0, session.duration_seconds - elapsed);

    // Exam-safe payload: NO mcq_answer, NO solution_md.
    const { data: qs } = await supabase
      .from("questions")
      .select("id, title, kind, difficulty, body_md, tests, mcq_options, setup_sql")
      .in("id", session.question_ids);

    const order = new Map<string, number>(
      session.question_ids.map((qid: string, i: number) => [qid, i]),
    );
    const questions: ExamQuestion[] = (qs ?? [])
      .slice()
      .sort(
        (a: { id: string }, b: { id: string }) =>
          (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      )
      .map(
        (q: {
          id: string;
          title: string;
          kind: ExamQuestion["kind"];
          difficulty: ExamQuestion["difficulty"];
          body_md: string;
          tests: ExamQuestion["tests"];
          mcq_options: ExamQuestion["mcq_options"];
          setup_sql: string | null;
        }) => ({
          id: q.id,
          title: q.title,
          kind: q.kind,
          difficulty: q.difficulty,
          body_md: q.body_md,
          tests: q.tests ?? [],
          mcq_options: q.mcq_options ?? [],
          mcq_answer: null, // never sent to the client during an exam
          setup_sql: q.setup_sql,
        }),
      );

    return (
      <ExamRunner
        sessionId={sessionId}
        remainingSeconds={remaining}
        questions={questions}
      />
    );
  }

  // Submitted / expired → results
  const [{ data: answers }, { data: qs }] = await Promise.all([
    supabase
      .from("exam_answers")
      .select("question_id, is_correct, answer")
      .eq("session_id", sessionId),
    supabase
      .from("questions")
      .select("id, title, kind, difficulty")
      .in("id", session.question_ids),
  ]);

  return (
    <ExamResults
      session={session}
      answers={answers ?? []}
      questions={qs ?? []}
    />
  );
}
