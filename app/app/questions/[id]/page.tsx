import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getCurrentUser,
  getNote,
  getQuestionById,
  getSubjectQuestionList,
  getUserAttempts,
} from "@/lib/queries";
import { bestTimeByQuestion, statusByQuestion } from "@/lib/metrics";
import { extractSqlBlock } from "@/lib/sql";
import { createClient } from "@/lib/supabase/server";
import { hasPhoneOnFile } from "@/lib/require-phone";
import {
  QuestionIDE,
  type IDETopicGroup,
} from "@/components/question/question-ide";
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

  const [allQuestions, user] = await Promise.all([
    getSubjectQuestionList(subject.id),
    getCurrentUser(),
  ]);

  // Middleware already required a session here; a phone number is the other
  // half of the gate, and this is where it is enforced rather than trusted from
  // the button that linked in. Back to the subject with the picker asking for
  // it, which is where the learner can actually supply one.
  if (!user) redirect(`/login?next=/app/questions/${id}`);
  const supabase = await createClient();
  if (!(await hasPhoneOnFile(supabase, user.id))) {
    redirect(`/app/subjects/${subject.slug}?needphone=1`);
  }

  let status = new Map<string, QuestionStatus>();
  let bestSeconds: number | null = null;
  let note = "";
  if (user) {
    const attempts = await getUserAttempts(user.id);
    status = statusByQuestion(attempts);
    bestSeconds = bestTimeByQuestion(attempts).get(id) ?? null;
    const existing = await getNote(user.id, id);
    note = existing?.content_md ?? "";
  }

  // Group the subject's questions by topic (week) for the left navigation.
  // Test Series papers keep their own questions and are sat from Test Series,
  // so they are not listed here — they carry no topic and would otherwise pile
  // up under an "Other" heading.
  const groupMap = new Map<string, IDETopicGroup>();
  for (const q of allQuestions) {
    const key = q.topic?.id ?? "none";
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        label: q.topic?.name ?? "Other",
        week: q.topic?.week ?? null,
        questions: [],
      });
    }
    groupMap.get(key)!.questions.push({
      id: q.id,
      title: q.title,
      status: status.get(q.id) ?? "unsolved",
    });
  }
  const groups = [...groupMap.values()].sort(
    (a, b) => (a.week ?? 99) - (b.week ?? 99),
  );

  return (
    <QuestionIDE
      subject={{ name: subject.name, slug: subject.slug }}
      current={{
        id: question.id,
        title: question.title,
        kind: question.kind,
        difficulty: question.difficulty,
        body_md: question.body_md,
        solution_md: question.solution_md,
        input_labels: question.input_labels,
        tests: question.tests,
        mcq_options: question.mcq_options,
        mcq_answer: question.mcq_answer,
        setup_sql: question.setup_sql,
        starter_code: question.starter_code,
        language: question.language,
        harness: question.harness,
        reference_sql:
          question.kind === "sql"
            ? extractSqlBlock(question.solution_md)
            : null,
        topicName: topic?.name ?? null,
        week: topic?.week ?? null,
      }}
      groups={groups}
      isAuthed={!!user}
      initialStatus={status.get(id) ?? "unsolved"}
      initialNote={note}
      initialBestSeconds={bestSeconds}
    />
  );
}
