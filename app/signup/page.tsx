import { redirect } from "next/navigation";

/**
 * Sign-up is not a separate flow: "Continue with Google" on the login page
 * creates the account if there isn't one. This route only exists so old links
 * and bookmarks still land somewhere sensible — it forwards to /login, carrying
 * any `next` along.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const q =
    next && next.startsWith("/") && !next.startsWith("//")
      ? `?next=${encodeURIComponent(next)}`
      : "";
  redirect(`/login${q}`);
}
