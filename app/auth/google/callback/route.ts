import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  GOOGLE_TOKEN_URL,
  NEXT_COOKIE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
  googleClientId,
  googleClientSecret,
  redirectUri,
  safeNext,
  siteOrigin,
} from "@/lib/google-oauth";

/**
 * Completes the handshake: verifies `state`, exchanges the code with Google
 * (server-to-server, using our client secret + PKCE verifier) for an id_token,
 * then hands that token to Supabase. Supabase validates it against the
 * configured Google client, upserts auth.users (the profile trigger creates the
 * profiles row), and sets the session cookie — all without the browser ever
 * touching supabase.co.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const origin = siteOrigin(request);
  const params = request.nextUrl.searchParams;

  const clearTemp = () => {
    cookieStore.delete(STATE_COOKIE);
    cookieStore.delete(VERIFIER_COOKIE);
    cookieStore.delete(NEXT_COOKIE);
  };
  const fail = (reason: string) => {
    clearTemp();
    const url = new URL("/login", origin);
    url.searchParams.set("error", reason);
    return NextResponse.redirect(url);
  };

  if (params.get("error")) return fail("google");

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const verifier = cookieStore.get(VERIFIER_COOKIE)?.value;
  const next = safeNext(cookieStore.get(NEXT_COOKIE)?.value);

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return fail("state");
  }

  // Exchange the authorization code for tokens — server side, secret never
  // leaves the box.
  let idToken: string | undefined;
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId(),
        client_secret: googleClientSecret(),
        redirect_uri: redirectUri(request),
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    if (!tokenRes.ok) return fail("token");
    idToken = ((await tokenRes.json()) as { id_token?: string }).id_token;
  } catch {
    return fail("token");
  }
  if (!idToken) return fail("token");

  // Supabase is the mediator: it verifies the Google id_token and mints our
  // session. This is the only point Supabase is involved, and it's server side.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error || !data.user) return fail("session");

  clearTemp();
  return NextResponse.redirect(new URL(next, origin));
}
