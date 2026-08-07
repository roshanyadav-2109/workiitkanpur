"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PHONE_REQUIRED, hasPhoneOnFile } from "@/lib/require-phone";
import type { AttemptStatus } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CODE = 200_000;
const MAX_NOTE = 20_000;

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
  if (!input || typeof input.questionId !== "string" || !UUID.test(input.questionId))
    return { ok: false, error: "Invalid question." };
  if (input.status !== "attempted" && input.status !== "solved")
    return { ok: false, error: "Invalid attempt status." };
  if (!Number.isFinite(input.timeSpentSeconds))
    return { ok: false, error: "Invalid solve time." };
  if (
    input.selfRating != null &&
    (!Number.isInteger(input.selfRating) || input.selfRating < 1 || input.selfRating > 5)
  ) return { ok: false, error: "Invalid self-rating." };
  if (input.code != null && input.code.length > MAX_CODE)
    return { ok: false, error: "Code is too large to save." };
  if (input.language != null && input.language.length > 32)
    return { ok: false, error: "Invalid language." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to sign in to save progress." };
  if (!(await hasPhoneOnFile(supabase, user.id)))
    return { ok: false, error: PHONE_REQUIRED };

  const { error } = await supabase.from("attempts").insert({
    user_id: user.id,
    question_id: input.questionId,
    status: input.status,
    time_spent_seconds: Math.min(604800, Math.max(0, Math.round(input.timeSpentSeconds))),
    self_rating: input.selfRating ?? null,
    is_correct: input.isCorrect ?? null,
  });
  if (error) return { ok: false, error: "Could not save this attempt." };

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
  revalidateTag("leaderboard", "max"); // a solve changes the standings
  return { ok: true };
}

/** Store the last code the user submitted for a question (upsert, no history). */
export async function saveSubmission(input: {
  questionId: string;
  code: string;
  language?: string | null;
}): Promise<ActionResult> {
  if (!input || typeof input.questionId !== "string" || !UUID.test(input.questionId))
    return { ok: false, error: "Invalid question." };
  if (typeof input.code !== "string" || input.code.length > MAX_CODE)
    return { ok: false, error: "Code is too large to save." };
  if (input.language != null && input.language.length > 32)
    return { ok: false, error: "Invalid language." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to sign in to save your code." };
  if (!(await hasPhoneOnFile(supabase, user.id)))
    return { ok: false, error: PHONE_REQUIRED };
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
  if (error) return { ok: false, error: "Could not save your code." };
  return { ok: true };
}

export async function saveNote(input: {
  questionId: string;
  content: string;
}): Promise<ActionResult> {
  if (!input || typeof input.questionId !== "string" || !UUID.test(input.questionId))
    return { ok: false, error: "Invalid question." };
  if (typeof input.content !== "string" || input.content.length > MAX_NOTE)
    return { ok: false, error: "Please keep notes under 20,000 characters." };
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
  if (error) return { ok: false, error: "Could not save your note." };

  revalidatePath(`/app/questions/${input.questionId}`);
  return { ok: true };
}

export async function updateProfile(input: {
  displayName: string;
  phone: string;
}): Promise<ActionResult> {
  if (!input || typeof input.displayName !== "string" || typeof input.phone !== "string")
    return { ok: false, error: "Invalid profile details." };
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
  if (error) return { ok: false, error: "Could not update your profile." };

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { ok: true };
}

/** Save just the phone number (used by the verify-to-continue gate). */
export async function savePhone(phone: string): Promise<ActionResult> {
  if (typeof phone !== "string" || phone.length > 32)
    return { ok: false, error: "Invalid phone number." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ phone: phone.trim().slice(0, 20) || null })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Could not save your phone number." };

  revalidatePath("/app/settings");
  return { ok: true };
}
