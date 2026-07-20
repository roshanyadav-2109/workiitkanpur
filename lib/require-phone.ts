import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Practising requires a phone number on file.
 *
 * The modal in components/phone/phone-gate.tsx is only the prompt — it can be
 * skipped by calling a server action directly or by typing a URL, so every
 * action that records practice checks this too. This is the enforcement point.
 */
export const PHONE_REQUIRED =
  "Add your phone number before you start practising.";

export async function hasPhoneOnFile(
  supabase: Client,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .maybeSingle();
  return !!data?.phone;
}
