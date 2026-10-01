import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The server's own reader for question content: the text, the tests, the
 * answer keys. Those columns are not readable with the public or the
 * signed-in key (0025) — every browser has those keys, and with them the whole
 * bank could be downloaded in minutes. The server reads them here with the
 * service role and decides what each visitor is shown (lib/access.ts).
 *
 * The service role bypasses row-level security: never hand this client, or
 * what it returns, to a caller unchecked, and never import it into anything
 * that reaches the browser.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, "public", any> | null = null;

/** Made on first use, so a build without the key fails only where content is read. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createContentClient(): SupabaseClient<any, "public", any> {
  if (!client) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
