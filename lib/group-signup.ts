/**
 * Puts a newly signed-in student into the Unknown IITians announcement groups.
 *
 * The main site (unknowniitians.com) keeps Google Groups ui-announcements-01 …
 * NN, 499 members each, with one address book for all its sites: an email that
 * already has a place gets its old one back and is never added twice, and when
 * a group fills the next is made. This site keeps no book of its own — it
 * sends {email, source} to the same function the other sites use, and that
 * function takes a place and queues the email for Google.
 *
 * Called from the sign-in callback after the IIT Madras check, so only IITM
 * accounts are ever sent. The answer is written to public.group_signups
 * (0024) through mark_group_signup(). Sending twice is harmless: the answer is
 * "already assigned". A failure is never shown to the student; the row stays
 * 'failed' and the next sign-in sends the email again.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const ENDPOINT =
  process.env.PROMO_GROUP_ENDPOINT ??
  "https://qzrvctpwefhmcduariuw.supabase.co/functions/v1/promotional-group-add-member";

interface Answer {
  success?: boolean;
  group_number?: number;
  was_already_assigned?: boolean;
  error?: string;
}

export async function addToAnnouncementGroups(supabase: SupabaseClient, email: string): Promise<void> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "oppepractice" }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as Answer;
    const ok = response.ok && body.success === true;
    await supabase.rpc("mark_group_signup", {
      p_ok: ok,
      p_group_number: ok ? (body.group_number ?? null) : null,
      p_was_already_assigned: ok ? (body.was_already_assigned ?? null) : null,
      p_error: ok ? null : (body.error ?? `HTTP ${response.status}`),
    });
  } catch (caught) {
    await supabase
      .rpc("mark_group_signup", {
        p_ok: false,
        p_error: caught instanceof Error ? caught.message : String(caught),
      })
      .then(undefined, () => undefined);
  }
}
