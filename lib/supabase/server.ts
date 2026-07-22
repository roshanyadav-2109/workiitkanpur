import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Server (server component / route handler) Supabase client.
 * Uses the public anon key + the user's cookie session — never the service role.
 *
 * Wrapped in React `cache()` so one render pass reuses a single client instead
 * of rebuilding it (and re-reading the cookie store) for every query.
 */
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookie writes are ignored here;
            // the middleware refreshes the session cookie instead.
          }
        },
      },
    },
  );
});
