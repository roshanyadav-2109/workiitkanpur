import type { NextRequest } from "next/server";

/**
 * Helpers for the self-hosted Google sign-in handshake.
 *
 * The whole OAuth dance (redirect to Google, code exchange) happens on our own
 * domain. Supabase is only handed the resulting, verified Google id_token via
 * `signInWithIdToken` — it never takes part in the browser redirect, so users
 * only ever see our domain and accounts.google.com.
 */

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_SCOPES = "openid email profile";

// Short-lived, httpOnly cookies that carry the flow's state across the redirect.
export const STATE_COOKIE = "g_oauth_state";
export const VERIFIER_COOKIE = "g_oauth_verifier";
export const NEXT_COOKIE = "g_oauth_next";

export function googleClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID is not set");
  return id;
}

export function googleClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET is not set");
  return secret;
}

/**
 * The public origin the browser is actually on — the custom domain in
 * production, localhost in dev. Prefer an explicit override, then the proxy
 * headers a custom domain sits behind, then the request origin.
 */
export function siteOrigin(request: NextRequest): string {
  const override = process.env.NEXT_PUBLIC_SITE_URL;
  if (override) return override.replace(/\/+$/, "");
  const host = request.headers.get("x-forwarded-host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

/** The redirect URI registered with Google — always on our own domain. */
export function redirectUri(request: NextRequest): string {
  return `${siteOrigin(request)}/auth/google/callback`;
}

/** Only allow same-site relative redirects back into the app. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/app/subjects";
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A URL-safe random token, used for both `state` and the PKCE verifier. */
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64url(buf);
}

/** S256 PKCE challenge for a given verifier. */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64url(new Uint8Array(digest));
}
