"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttemptStatus } from "@/lib/types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function recordAttempt(input: {
  questionId: string;
  status: AttemptStatus;
  timeSpentSeconds: number;
  selfRating?: number | null;
  isCorrect?: boolean | null;
  code?: string | null;
  language?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to sign in to save progress." };

  const { error } = await supabase.from("attempts").insert({
    user_id: user.id,
    question_id: input.questionId,
    status: input.status,
    time_spent_seconds: Math.max(0, Math.round(input.timeSpentSeconds)),
    self_rating: input.selfRating ?? null,
    is_correct: input.isCorrect ?? null,
  });
  if (error) return { ok: false, error: error.message };

  // Keep only the last submitted code per question (no full history).
  if (input.code != null && input.code.trim() !== "") {
    await supabase.from("submissions").upsert(
      {
        user_id: user.id,
        question_id: input.questionId,
        code: input.code,
        language: input.language ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,question_id" },
    );
  }

  revalidatePath("/app");
  revalidatePath("/app/progress");
  revalidatePath(`/app/questions/${input.questionId}`);
  return { ok: true };
}

/** Store the last code the user submitted for a question (upsert, no history). */
export async function saveSubmission(input: {
  questionId: string;
  code: string;
  language?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to sign in to save your code." };
  if (!input.code.trim()) return { ok: true };

  const { error } = await supabase.from("submissions").upsert(
    {
      user_id: user.id,
      question_id: input.questionId,
      code: input.code,
      language: input.language ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,question_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveNote(input: {
  questionId: string;
  content: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to sign in to save notes." };

  const { error } = await supabase.from("notes").upsert(
    {
      user_id: user.id,
      question_id: input.questionId,
      content_md: input.content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,question_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/questions/${input.questionId}`);
  return { ok: true };
}

export async function updateProfile(input: {
  displayName: string;
  phone: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName.trim().slice(0, 80),
      phone: input.phone.trim().slice(0, 20) || null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { ok: true };
}
