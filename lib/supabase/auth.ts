import "server-only";

import type {
  SupabaseClient,
  UserAppMetadata,
  UserMetadata,
} from "@supabase/supabase-js";

/**
 * The small, verified user shape the application actually reads.
 *
 * `getClaims()` validates the access-token signature. On this project's ES256
 * signing key that happens locally against Supabase's cached JWKS, avoiding a
 * `/auth/v1/user` response on every page view and server action.
 */
export interface VerifiedUser {
  id: string;
  email?: string;
  user_metadata: UserMetadata;
  app_metadata: UserAppMetadata;
}

export async function getVerifiedUser(
  supabase: SupabaseClient,
): Promise<VerifiedUser | null> {
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    user_metadata: claims.user_metadata ?? {},
    app_metadata: claims.app_metadata ?? {},
  };
}

export async function getVerifiedUserId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();
  return error ? null : (data?.claims.sub ?? null);
}
