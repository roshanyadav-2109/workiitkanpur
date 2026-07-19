import { type NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_AUTH_URL,
  GOOGLE_SCOPES,
  NEXT_COOKIE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
  googleClientId,
  pkceChallenge,
  randomToken,
  redirectUri,
  safeNext,
} from "@/lib/google-oauth";

/**
 * Kicks off Google sign-in from our own domain: mints CSRF `state` + a PKCE
 * pair, stashes them in short-lived httpOnly cookies, then bounces the browser
 * to Google's consent screen. Google returns to /auth/google/callback.
 */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = await pkceChallenge(verifier);

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", googleClientId());
  authUrl.searchParams.set("redirect_uri", redirectUri(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl);
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600, // 10 minutes to complete the handshake
  };
  res.cookies.set(STATE_COOKIE, state, opts);
  res.cookies.set(VERIFIER_COOKIE, verifier, opts);
  res.cookies.set(NEXT_COOKIE, next, opts);
  return res;
}
