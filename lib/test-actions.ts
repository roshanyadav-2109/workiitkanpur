"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PHONE_REQUIRED, hasPhoneOnFile } from "@/lib/require-phone";
import { getSubjectBySlug, getTestSets } from "@/lib/queries";
import { scorePaper, type ScoredSection } from "@/lib/scoring";
import { logEvent } from "@/lib/activity";

export type TestActionResult =
  | { ok: true; score: number; total: number }
  | { ok: false; error: string };

/**
 * Open a Test Series attempt. Called from the run page once the learner is on
 * the paper — the row is what everything else hangs off, so the clock, the
 * answers and the score all belong to a real server-side attempt rather than
 * to localStorage.
 *
 * An in-progress attempt for the same set is reused, so a refresh resumes
 * instead of opening a second row.
 */
export async function startTestAttempt(input: {
  slug: string;
  setId: string;
  environment: "learning" | "exam";
}): Promise<{ attemptId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!(await hasPhoneOnFile(supabase, user.id)))
    return { error: PHONE_REQUIRED };

  const subject = await getSubjectBySlug(input.slug);
  if (!subject) return { error: "Subject not found." };

  const set = (await getTestSets(subject.id)).find((s) => s.id === input.setId);
  if (!set || !set.available) return { error: "Set not available." };

  const { data: open } = await supabase
    .from("test_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("set_id", set.id)
    .eq("subject_slug", input.slug)
    .eq("environment", input.environment)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (open?.id) return { attemptId: open.id as string };

  const questionIds = set.sections.flatMap((s) => s.questionIds);
  const { data: attempt, error } = await supabase
    .from("test_attempts")
    .insert({
      user_id: user.id,
      subject_id: subject.id,
      subject_slug: input.slug,
      set_id: set.id,
      set_name: set.name,
      environment: input.environment,
      question_ids: questionIds,
      duration_seconds: set.durationSeconds,
    })
    .select("id")
    .single();

  if (error || !attempt) return { error: error?.message ?? "Could not start." };

  await logEvent({
    event: "test_start",
    subjectId: subject.id,
    setSlug: set.id,
    meta: { environment: input.environment, questions: questionIds.length },
  });
  return { attemptId: attempt.id as string };
}

export interface TestSubmitAnswer {
  questionId: string;
  answer: string | null;
  /** Client-run judge result for coding/sql; ignored for MCQ. */
  isCorrect: boolean | null;
  status: "none" | "answered" | "review";
  timeSpent: number;
}

/**
 * Final-submit a Test Series attempt: grade every question in the set, write
 * the answers, and close the attempt. MCQs are graded here against the stored
 * key so a client can't claim a correct answer; coding and SQL are graded from
 * the in-browser judge, which is the only place the tests actually run.
 */
export async function submitTestAttempt(input: {
  attemptId: string;
  answers: TestSubmitAnswer[];
  leaveCount: number;
  timeSeconds: number;
}): Promise<TestActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!(await hasPhoneOnFile(supabase, user.id)))
    return { ok: false, error: PHONE_REQUIRED };

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("id, user_id, question_ids, status, subject_slug, set_id, score, total")
    .eq("id", input.attemptId)
    .maybeSingle();
  if (!attempt || attempt.user_id !== user.id)
    return { ok: false, error: "Attempt not found." };
  // Already closed (e.g. the timer auto-submitted first) — report the stored
  // score rather than grading a second time.
  if (attempt.status !== "in_progress")
    return { ok: true, score: attempt.score ?? 0, total: attempt.total ?? 0 };

  const questionIds: string[] = attempt.question_ids ?? [];
  const { data: questions } = await supabase
    .from("questions")
    .select("id, kind, mcq_answer")
    .in("id", questionIds);
  const qmap = new Map(
    (questions ?? []).map(
      (q: { id: string; kind: string; mcq_answer: string | null }) => [q.id, q],
    ),
  );

  const answerMap = new Map(input.answers.map((a) => [a.questionId, a]));
  const correctById = new Map<string, boolean>();
  const rows = questionIds.map((qid) => {
    const a = answerMap.get(qid);
    const q = qmap.get(qid);
    const isCorrect =
      q?.kind === "mcq"
        ? !!a && a.answer != null && a.answer === q.mcq_answer
        : !!a && a.isCorrect === true;
    correctById.set(qid, isCorrect);
    return {
      attempt_id: input.attemptId,
      user_id: user.id,
      question_id: qid,
      answer: a?.answer ?? null,
      is_correct: isCorrect,
      q_status: a?.status ?? "none",
      time_spent_seconds: Math.max(0, Math.round(a?.timeSpent ?? 0)),
    };
  });

  if (rows.length > 0) {
    const { error: aErr } = await supabase
      .from("test_answers")
      .upsert(rows, { onConflict: "attempt_id,question_id" });
    if (aErr) return { ok: false, error: aErr.message };
  }

  // Score from the paper's own rules: each question's marks, and each section's
  // best-of. Falls back to one point per question if the paper can't be read,
  // which is what every paper without explicit marks scores anyway.
  const paper = await scorePaperForAttempt({
    subjectSlug: attempt.subject_slug as string,
    setSlug: attempt.set_id as string,
    questionIds,
    correctById,
  });
  const { score, total } = paper;

  const { error: tErr } = await supabase
    .from("test_attempts")
    .update({
      status: "submitted",
      score,
      total,
      time_seconds: Math.max(0, Math.round(input.timeSeconds)),
      leave_count: Math.max(0, Math.round(input.leaveCount)),
      submitted_at: new Date().toISOString(),
    })
    .eq("id", input.attemptId);
  if (tErr) return { ok: false, error: tErr.message };

  await logEvent({
    event: "test_submit",
    setSlug: attempt.set_id as string,
    meta: {
      score,
      total,
      timeSeconds: Math.max(0, Math.round(input.timeSeconds)),
      leaveCount: Math.max(0, Math.round(input.leaveCount)),
    },
  });

  revalidatePath(`/app/subjects/${attempt.subject_slug}`);
  revalidatePath("/app/progress");
  return { ok: true, score, total };
}

/**
 * Turn a set of right/wrong answers into a marked paper, using the paper's own
 * marks and per-section best-of rules.
 *
 * If the paper can't be read the fallback is one mark per question, which is
 * exactly what a paper with no marks configured scores — so a lookup failure
 * costs the learner nothing.
 */
async function scorePaperForAttempt(input: {
  subjectSlug: string;
  setSlug: string;
  questionIds: string[];
  correctById: Map<string, boolean>;
}): Promise<{ score: number; total: number }> {
  const flat = () => ({
    score: input.questionIds.filter((id) => input.correctById.get(id)).length,
    total: input.questionIds.length,
  });

  try {
    const subject = await getSubjectBySlug(input.subjectSlug);
    if (!subject) return flat();
    const set = (await getTestSets(subject.id)).find(
      (s) => s.id === input.setSlug,
    );
    if (!set || set.sections.length === 0) return flat();

    const sections: ScoredSection[] = set.sections.map((s) => ({
      name: s.name,
      bestOf: s.bestOf ?? null,
      questions: s.questionIds.map((qid) => ({
        questionId: qid,
        correct: input.correctById.get(qid) === true,
        marks: s.marks?.[qid] ?? 1,
      })),
    }));
    const result = scorePaper(sections);
    return { score: result.score, total: result.total };
  } catch {
    return flat();
  }
}
