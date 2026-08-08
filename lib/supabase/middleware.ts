import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that require a signed-in user. The subject lists stay public so the
 * catalogue and question previews stay public. A signed-out shared-question
 * visit is gated inside the page after it renders, so the learner can see what
 * they were sent and Google can return them to that exact URL.
 */
function requiresAuth(pathname: string): boolean {
  return (
    pathname === "/app" ||
    pathname.startsWith("/app/progress") ||
    pathname.startsWith("/app/settings") ||
    // Test Series papers are graded and stored per learner.
    pathname.startsWith("/app/test")
  );
}

/** Supabase's SSR client stores the session in this cookie (chunked as .0,
 * .1, ... when necessary). Anonymous requests have none, so there is nothing
 * to refresh or validate and no reason to contact Auth for them. */
function hasSessionCookie(request: NextRequest): boolean {
  const projectRef = new URL(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
  ).hostname.split(".")[0];
  const base = `sb-${projectRef}-auth-token`;
  return request.cookies
    .getAll()
    .some(({ name }) => name === base || name.startsWith(`${base}.`));
}

/**
 * Refreshes the Supabase auth session on every request (so Server Components
 * always see a valid user) and gates the authenticated areas of the app.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // This is the dominant anonymous-traffic saving: crawlers and signed-out
  // visitors no longer turn every page/image-data request into an Auth call.
  if (!hasSessionCookie(request)) {
    if (requiresAuth(path)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", `${path}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims refreshes an expiring session and verifies ES256 tokens locally.
  // Unlike getSession, it is safe for authorization decisions; unlike getUser,
  // it does not download the full Auth user record on every request.
  const { data, error } = await supabase.auth.getClaims();
  const signedIn = !error && !!data?.claims.sub;

  if (!signedIn && requiresAuth(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // Signed-in users skip the auth screens.
  if (signedIn && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
