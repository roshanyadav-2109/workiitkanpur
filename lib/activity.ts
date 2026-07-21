"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Record one thing a learner did.
 *
 * Deliberately fire-and-forget: analytics must never break the thing it is
 * measuring, so a failure here is swallowed rather than surfaced. The user id
 * comes from the session, never from the caller — a client cannot log activity
 * as someone else, and RLS enforces the same on the row.
 */
export type ActivityEvent =
  | "page_view"
  | "question_open"
  | "run_code"
  | "run_tests"
  | "submit"
  | "solved"
  | "pdf_download"
  | "test_start"
  | "test_submit";

export async function logEvent(input: {
  event: ActivityEvent;
  questionId?: string | null;
  subjectId?: string | null;
  setSlug?: string | null;
  path?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // signed-out browsing is not attributed to anyone

    await supabase.from("activity_events").insert({
      user_id: user.id,
      event: input.event,
      question_id: input.questionId ?? null,
      subject_id: input.subjectId ?? null,
      set_slug: input.setSlug ?? null,
      path: input.path?.slice(0, 300) ?? null,
      meta: input.meta ?? {},
    });
  } catch {
    /* never let logging break the page */
  }
}
