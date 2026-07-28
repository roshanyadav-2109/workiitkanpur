import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Exchanges the OAuth / email-confirmation code for a session cookie. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  // Return the user to where they were; otherwise go straight to practice.
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/app/subjects";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Access is limited to IIT Madras accounts (iitm.ac.in and its
      // sub-domains). Reject anything else and drop the session immediately.
      const email = data.user?.email?.toLowerCase() ?? "";
      const domain = email.split("@")[1] ?? "";
      if (domain === "iitm.ac.in" || domain.endsWith(".iitm.ac.in")) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=domain`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
