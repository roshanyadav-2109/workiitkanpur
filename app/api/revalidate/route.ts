import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * Admin cache-buster. Public content (subjects, questions, sets, leaderboards)
 * is cached in the Data Cache and edited directly in the database — the app
 * itself doesn't mutate it — so after a content change (e.g. flipping a subject
 * live or adding questions), hit this endpoint to refresh the shared cache.
 *
 *   POST /api/revalidate                    -> refreshes everything
 *   POST /api/revalidate?tag=content        -> refreshes content
 *   Authorization: Bearer <REVALIDATE_SECRET>
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.REVALIDATE_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (!expected || !safeEqual(supplied, expected))
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );

  const only = url.searchParams.get("tag");
  const tags = only && ["content", "leaderboard"].includes(only)
    ? [only]
    : ["content", "leaderboard"];
  // expire: 0 forces immediate expiry so the next request re-reads the DB.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json(
    { ok: true, revalidated: tags },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
