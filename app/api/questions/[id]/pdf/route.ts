import { readFile } from "node:fs/promises";
import path from "node:path";
import { getQuestionById } from "@/lib/queries";
import { buildQuestionPdf } from "@/lib/question-pdf";
import { createClient } from "@/lib/supabase/server";
import { hasPhoneOnFile } from "@/lib/require-phone";

/** The same editor screenshot rides along in every handout — read it once. */
let shotPromise: Promise<string | undefined> | null = null;
function editorScreenshot(): Promise<string | undefined> {
  shotPromise ??= readFile(path.join(process.cwd(), "public", "demo-coding.png"))
    .then((b) => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => undefined);
  return shotPromise;
}

/** Download a single question (with its solution) as a print-ready PDF. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // The handout contains the full solution, so it is behind the same gate as
  // practising: signed in, with a phone number on file. This is the enforcement
  // point — the buttons that link here can be bypassed by pasting the URL.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Sign in to download this question.", { status: 401 });
  }
  if (!(await hasPhoneOnFile(supabase, user.id))) {
    return new Response("Add your phone number to download this question.", {
      status: 403,
    });
  }

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
    url: new URL(`/app/questions/${id}`, req.url).toString(),
    screenshot: await editorScreenshot(),
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
