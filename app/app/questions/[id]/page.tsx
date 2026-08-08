import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCurrentUser,
  getNote,
  getMyQuestionProgress,
  getQuestionById,
  getQuestionSolutions,
  getSubjectQuestionList,
} from "@/lib/queries";
import { statusByQuestion } from "@/lib/metrics";
import { extractSqlBlock } from "@/lib/sql";
import { getSubjectResources } from "@/lib/subject-content";
import {
  QuestionIDE,
  type IDETopicGroup,
} from "@/components/question/question-ide";
import { QuestionLoginGate } from "@/components/auth/question-login-gate";
import type { QuestionStatus } from "@/components/ui/status";
import { JsonLd } from "@/components/seo/json-ld";
import {
  breadcrumbNode,
  jsonLdGraph,
  learningResourceNode,
  pageMetadata,
} from "@/lib/seo";

const KIND_LABEL = {
  coding: "coding exercise",
  sql: "SQL exercise",
  shell: "shell exercise",
  mcq: "multiple-choice question",
} as const;

function questionDescription({
  title,
  subject,
  difficulty,
  kind,
}: {
  title: string;
  subject: string;
  difficulty: string;
  kind: keyof typeof KIND_LABEL;
}) {
  const article = difficulty === "easy" ? "an" : "a";
  return `Solve ${title}, ${article} ${difficulty} ${KIND_LABEL[kind]} for ${subject} OPPE practice. Read the problem, run your answer and check it against test cases.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getQuestionById(id);
  if (!ctx) {
    return pageMetadata({
      title: "OPPE Practice Question",
      description: "OPPE programming practice question for the IIT Madras BS Degree.",
      path: `/app/questions/${id}`,
      index: false,
    });
  }
  const { question, subject } = ctx;
  return pageMetadata({
    title: `${question.title} — ${subject.short_code} OPPE Question`,
    description: questionDescription({
      title: question.title,
      subject: subject.name,
      difficulty: question.difficulty,
      kind: question.kind,
    }),
    path: `/app/questions/${id}`,
    keywords: [
      question.title,
      `${subject.name} OPPE question`,
      `${subject.short_code} OPPE practice`,
      `${question.difficulty} ${KIND_LABEL[question.kind]}`,
    ],
    index: question.practice_only,
  });
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

  let status = new Map<string, QuestionStatus>();
  let bestSeconds: number | null = null;
  let note = "";
  let solutionMd: string | null = null;
  if (user) {
    const [progress, existing, solutions] = await Promise.all([
      getMyQuestionProgress(subject.id),
      getNote(user.id, id),
      getQuestionSolutions([id]),
    ]);
    status = statusByQuestion(progress);
    const currentProgress = progress.find((row) => row.question_id === id);
    bestSeconds =
      currentProgress?.status === "solved"
        ? currentProgress.time_spent_seconds
        : null;
    note = existing?.content_md ?? "";
    solutionMd = solutions.get(id) ?? null;
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

  const returnTo = `/app/questions/${id}`;
  const description = questionDescription({
    title: question.title,
    subject: subject.name,
    difficulty: question.difficulty,
    kind: question.kind,
  });
  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Subjects", path: "/app/subjects" },
      { name: subject.name, path: `/app/subjects/${subject.slug}` },
      { name: question.title, path: returnTo },
    ]),
    learningResourceNode({
      name: question.title,
      description,
      path: returnTo,
      subject: subject.name,
      difficulty: question.difficulty,
      resourceType: KIND_LABEL[question.kind],
    }),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <QuestionIDE
        subject={{ name: subject.name, slug: subject.slug }}
        resourcesMd={getSubjectResources(subject.slug)}
        current={{
          id: question.id,
          title: question.title,
          kind: question.kind,
          difficulty: question.difficulty,
          body_md: question.body_md,
          solution_md: solutionMd,
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
              ? extractSqlBlock(solutionMd)
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
      {!user && (
        <QuestionLoginGate returnTo={returnTo} />
      )}
    </>
  );
}
