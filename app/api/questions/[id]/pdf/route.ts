import { getQuestionById } from "@/lib/queries";
import { buildQuestionPdf } from "@/lib/question-pdf";

/** Download a single question (with its solution) as a print-ready PDF. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getQuestionById(id);
  if (!ctx) return new Response("Not found", { status: 404 });

  const { question, subject, topic } = ctx;

  const bytes = buildQuestionPdf({
    title: question.title,
    subject: subject.name,
    topic: topic?.name ?? null,
    week: topic?.week ?? null,
    bodyMd: question.body_md,
    solutionMd: question.solution_md,
  });

  const slug = question.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return new Response(bytes as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug || "question"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
