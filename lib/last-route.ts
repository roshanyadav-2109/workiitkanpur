"use client";

/**
 * Where the learner was last, so returning to the site puts them back there
 * instead of at a landing page — a new tab, a fresh sign-in, or just coming
 * back tomorrow.
 *
 * localStorage rather than a cookie: it is per-browser navigation state, not
 * something the server needs, and it must survive the session cookie expiring.
 */
const KEY = "oppe:last-route";

/** Entry points are where you arrive, not where you were — never resume to one. */
const NOT_WORTH_RESUMING = ["/app", "/app/subjects"];

export function rememberRoute(path: string): void {
  if (!path.startsWith("/app")) return;
  if (NOT_WORTH_RESUMING.includes(path)) return;
  try {
    window.localStorage.setItem(KEY, path);
  } catch {
    /* private mode — resuming is a nicety, not worth failing over */
  }
}

/** The remembered route, or null. Validated: only same-site app paths. */
export function lastRoute(): string | null {
  try {
    const v = window.localStorage.getItem(KEY);
    if (!v || !v.startsWith("/app") || v.startsWith("//")) return null;
    return v;
  } catch {
    return null;
  }
}

export function forgetRoute(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
