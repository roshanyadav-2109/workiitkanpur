"use server";

import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/supabase/auth";

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

const EVENTS = new Set<ActivityEvent>([
  "page_view", "question_open", "run_code", "run_tests", "submit",
  "solved", "pdf_download", "test_start", "test_submit",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function logEvent(input: {
  event: ActivityEvent;
  questionId?: string | null;
  subjectId?: string | null;
  setSlug?: string | null;
  path?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    if (
      !input ||
      !EVENTS.has(input.event) ||
      (input.questionId != null && !UUID.test(input.questionId)) ||
      (input.subjectId != null && !UUID.test(input.subjectId)) ||
      (input.setSlug != null && input.setSlug.length > 100) ||
      (input.path != null && input.path.length > 300)
    ) return;
    const meta = input.meta ?? {};
    if (new TextEncoder().encode(JSON.stringify(meta)).length > 4096) return;

    const supabase = await createClient();
    const userId = await getVerifiedUserId(supabase);
    if (!userId) return; // signed-out browsing is not attributed to anyone

    await supabase.from("activity_events").insert({
      user_id: userId,
      event: input.event,
      question_id: input.questionId ?? null,
      subject_id: input.subjectId ?? null,
      set_slug: input.setSlug ?? null,
      path: input.path?.slice(0, 300) ?? null,
      meta,
    });
  } catch {
    /* never let logging break the page */
  }
}
