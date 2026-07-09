"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.round(n)));

/** Create a timed exam session over a random subset of a subject's questions. */
export async function startExam(formData: FormData) {
  const subjectId = String(formData.get("subjectId") ?? "");
  const count = clamp(Number(formData.get("count") ?? 5), 1, 20);
  const durationMinutes = clamp(Number(formData.get("duration") ?? 15), 1, 180);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/exam");

  const { data: qs } = await supabase
    .from("questions")
    .select("id")
    .eq("subject_id", subjectId);
  if (!qs || qs.length === 0) redirect("/app/exam?error=empty");

  const ids = shuffle(qs.map((q: { id: string }) => q.id)).slice(
    0,
    Math.min(count, qs.length),
  );

  const { data: session, error } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      question_ids: ids,
      duration_seconds: durationMinutes * 60,
    })
    .select("id")
    .single();

  if (error || !session) redirect("/app/exam?error=start");
  redirect(`/app/exam/${session.id}`);
}

export interface ExamSubmitAnswer {
  questionId: string;
  answer: string | null;
  isCorrect: boolean | null; // client-graded for coding; null for mcq
  timeSpent: number;
}

export async function submitExam(input: {
  sessionId: string;
  answers: ExamSubmitAnswer[];
  leaveCount: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: session } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", input.sessionId)
    .maybeSingle();
  if (!session || session.user_id !== user.id)
    return { ok: false, error: "Exam not found." };
  if (session.status !== "in_progress") return { ok: true };

  const { data: questions } = await supabase
    .from("questions")
    .select("id, kind, mcq_answer")
    .in("id", session.question_ids);
  const qmap = new Map(
    (questions ?? []).map((q: { id: string; kind: string; mcq_answer: string | null }) => [
      q.id,
      q,
    ]),
  );

  const answerMap = new Map(input.answers.map((a) => [a.questionId, a]));
  const total: number = session.question_ids.length;
  let score = 0;
  const rows = session.question_ids.map((qid: string) => {
    const a = answerMap.get(qid);
    const q = qmap.get(qid);
    let isCorrect = false;
    if (q?.kind === "mcq") {
      isCorrect = !!a && a.answer != null && a.answer === q.mcq_answer;
    } else {
      isCorrect = !!a && a.isCorrect === true;
    }
    if (isCorrect) score++;
    return {
      session_id: input.sessionId,
      user_id: user.id,
      question_id: qid,
      answer: a?.answer ?? null,
      is_correct: isCorrect,
      time_spent_seconds: a?.timeSpent ?? 0,
    };
  });

  const { error: aErr } = await supabase
    .from("exam_answers")
    .upsert(rows, { onConflict: "session_id,question_id" });
  if (aErr) return { ok: false, error: aErr.message };

  const { error: sErr } = await supabase
    .from("exam_sessions")
    .update({
      status: "submitted",
      score,
      total,
      leave_count: input.leaveCount,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", input.sessionId);
  if (sErr) return { ok: false, error: sErr.message };

  revalidatePath(`/app/exam/${input.sessionId}`);
  revalidatePath("/app/exam");
  return { ok: true };
}
