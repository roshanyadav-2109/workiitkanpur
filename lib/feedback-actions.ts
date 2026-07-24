"use server";

import { createClient } from "@/lib/supabase/server";

export type FeedbackResult = { ok: true } | { ok: false; error: string };

/**
 * Store a piece of feedback. Login is not required — a signed-out visitor can
 * send it too (RLS allows the insert; nothing can be read back through the API).
 * If the visitor happens to be signed in, their user id is attached.
 */
export async function submitFeedback(input: {
  name?: string;
  email?: string;
  phone?: string;
  message: string;
}): Promise<FeedbackResult> {
  const message = (input.message ?? "").trim();
  if (message.length === 0) {
    return { ok: false, error: "Please write your feedback before sending." };
  }
  if (message.length > 5000) {
    return { ok: false, error: "Please keep your feedback under 5000 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    name: input.name?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    message,
  });
  if (error) {
    return { ok: false, error: "Could not send your feedback. Please try again." };
  }
  return { ok: true };
}
