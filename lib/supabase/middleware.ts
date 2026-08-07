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

/**
 * Refreshes the Supabase auth session on every request (so Server Components
 * always see a valid user) and gates the authenticated areas of the app.
 */
export async function updateSession(request: NextRequest) {
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

  // IMPORTANT: getUser() must be called to refresh the token; do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && requiresAuth(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Signed-in users skip the auth screens.
  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
