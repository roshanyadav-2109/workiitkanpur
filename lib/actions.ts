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

  revalidatePath("/app");
  revalidatePath("/app/progress");
  revalidatePath(`/app/questions/${input.questionId}`);
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

export async function updateDisplayName(
  displayName: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const trimmed = displayName.trim().slice(0, 80);
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { ok: true };
}
