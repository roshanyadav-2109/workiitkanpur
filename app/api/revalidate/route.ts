import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * Admin cache-buster. Public content (subjects, questions, sets, leaderboards)
 * is cached in the Data Cache and edited directly in the database — the app
 * itself doesn't mutate it — so after a content change (e.g. flipping a subject
 * live, adding questions) hit this to refresh the cache immediately instead of
 * waiting out the revalidate window.
 *
 *   GET /api/revalidate?secret=...            -> refreshes everything
 *   GET /api/revalidate?secret=...&tag=content
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (
    !process.env.REVALIDATE_SECRET ||
    secret !== process.env.REVALIDATE_SECRET
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const only = url.searchParams.get("tag");
  const tags = only ? [only] : ["content", "leaderboard"];
  // expire: 0 forces immediate expiry so the next request re-reads the DB.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ ok: true, revalidated: tags });
}
