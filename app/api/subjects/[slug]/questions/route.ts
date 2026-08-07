import { NextResponse } from "next/server";
import {
  getSubjectBySlug,
  getSubjectQuestionPage,
} from "@/lib/queries";
import {
  QUESTION_BATCH_SIZE,
  questionRows,
  type QuestionBatchResponse,
} from "@/lib/question-list-data";

const MAX_OFFSET = 10_000;

/** Public, progressively loaded practice rows. The database result underneath
 * this handler is shared in Next's Data Cache across all visitors. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const rawOffset = Number(new URL(request.url).searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(rawOffset)
    ? Math.min(MAX_OFFSET, Math.max(0, Math.floor(rawOffset)))
    : 0;

  const subject = await getSubjectBySlug(slug);
  if (!subject?.is_active) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const page = await getSubjectQuestionPage(
    subject.id,
    offset,
    QUESTION_BATCH_SIZE,
  );
  const response: QuestionBatchResponse = {
    rows: questionRows(page.questions),
    hasMore: page.hasMore,
    nextOffset: offset + page.questions.length,
  };

  return NextResponse.json(response, {
    headers: {
      // CDN/browser revalidation is shorter than the underlying tagged Data
      // Cache so an explicit content invalidation can propagate promptly.
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
