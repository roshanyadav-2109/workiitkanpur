import { createServerClient } from "@supabase/ssr";

/**
 * A cookieless, session-less anon Supabase client for PUBLIC content only —
 * subjects, topics, questions, test sets, leaderboards. Because it reads no
 * cookies (getAll returns nothing), the functions that use it stay static and
 * can be wrapped in `unstable_cache`: a question fetched once is served from
 * Next's Data Cache to every visitor, so Supabase isn't hit per user/request.
 *
 * Never use this for per-user data — it has no session, so RLS sees an
 * anonymous caller. That's exactly what we want for shared public content.
 */
export function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no session to persist */
        },
      },
    },
  );
}
