import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getCurrentUser,
  getMySubmission,
  getNote,
  getQuestionById,
  getQuestionLeaderboard,
  getQuestionTopSolutions,
} from "@/lib/queries";
import { Markdown } from "@/components/markdown";
import { IconChevron } from "@/components/icons";
import { RankMedal } from "@/components/progress/rank-medal";
import {
  SolutionCompare,
  type CompareSolution,
} from "@/components/progress/solution-compare";
import { buttonVariants } from "@/components/ui/button";
import { formatClock, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Question analysis" };

export default async function QuestionAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=/app/progress/question/${id}`);

  const ctx = await getQuestionById(id);
  if (!ctx) notFound();

  const [board, solutions, mySub, myNote] = await Promise.all([
    getQuestionLeaderboard(id, 10),
    getQuestionTopSolutions(id, 10),
    getMySubmission(user.id, id),
    getNote(user.id, id),
  ]);

  const times = board.map((b) => b.best_time);
  const fastest = times.length ? Math.min(...times) : null;
  const avg = times.length
    ? Math.round(times.reduce((s, t) => s + t, 0) / times.length)
    : null;
  const myIdx = board.findIndex((b) => b.user_id === user.id);
  const myTime = myIdx >= 0 ? board[myIdx].best_time : null;

  const compareSolutions: CompareSolution[] = solutions.map((s) => ({
    user_id: s.user_id,
    name: s.name,
    best_time: s.best_time,
    code: s.code,
    note: s.note,
    me: s.user_id === user.id,
  }));

  const publicTests = ctx.question.tests.filter((t) => !t.hidden);
  const hiddenCount = ctx.question.tests.filter((t) => t.hidden).length;

  return (
    <div className="w-full">
      {/* Back button */}
      <div className="mb-3">
        <Link
          href="/app/progress"
          aria-label="Back to My progress"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-hairline bg-canvas text-fg-muted transition-colors hover:border-[#3d3d3d] hover:text-fg"
        >
          <IconChevron size={16} className="rotate-180" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* MAIN — one common purple section */}
        <div className="rounded-[10px] bg-accent-weak p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em]">
                {ctx.question.title}
              </h1>
              <p className="mt-1 text-[13px] text-fg-muted">
                {ctx.subject.name}
                {ctx.topic ? ` · ${ctx.topic.name}` : ""} · {board.length} solvers
              </p>
            </div>
            <Link
              href={`/app/questions/${id}`}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Open question →
            </Link>
          </div>

          {/* your time comparison */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatBox
              label="Your best time"
              value={myTime != null ? formatClock(myTime) : "—"}
              hint={myIdx >= 0 ? `rank #${myIdx + 1}` : "not solved yet"}
            />
            <StatBox
              label="Fastest solve"
              value={fastest != null ? formatClock(fastest) : "—"}
              hint={board[0]?.name ?? ""}
            />
            <StatBox
              label="Average solve"
              value={avg != null ? formatClock(avg) : "—"}
              hint="across solvers"
            />
          </div>

          {/* question + test cases */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[10px] border border-hairline bg-canvas p-4">
              <div className="mb-2 text-[13.5px] font-semibold">The question</div>
              <div className="prose-oppe max-h-[280px] overflow-auto text-[14px]">
                <Markdown>{ctx.question.body_md}</Markdown>
              </div>
            </div>
            <div className="rounded-[10px] border border-hairline bg-canvas p-4">
              <div className="mb-2 text-[13.5px] font-semibold">
                Sample test cases
              </div>
              {publicTests.length === 0 ? (
                <p className="text-[13px] text-fg-muted">
                  No sample tests for this question.
                </p>
              ) : (
                <div className="space-y-2">
                  {publicTests.map((t, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 gap-2 rounded-[7px] border border-hairline bg-surface p-2.5 text-[12px]"
                    >
                      <div>
                        <div className="mb-1 text-[11px] text-fg-muted">Input</div>
                        <pre className="whitespace-pre-wrap font-mono text-fg">
                          {t.stdin || "—"}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-1 text-[11px] text-fg-muted">
                          Expected
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-fg">
                          {t.expected || "—"}
                        </pre>
                      </div>
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <p className="text-[12px] text-fg-muted">
                      + {hiddenCount} hidden {hiddenCount === 1 ? "test" : "tests"}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* compare — your code/notes vs the toppers' */}
          <div className="mt-6">
            <h2 className="text-[16px] font-semibold">
              How the top solvers approached it
            </h2>
            <p className="mb-4 text-[13px] text-fg-muted">
              Pick a solver to compare their code and notes against your own.
            </p>
            <SolutionCompare
              mine={
                mySub || myNote
                  ? { code: mySub?.code ?? null, note: myNote?.content_md ?? null }
                  : null
              }
              solutions={compareSolutions}
            />
          </div>
        </div>

        {/* RIGHT — fixed, non-scrolling leaderboard column */}
        <aside className="lg:sticky lg:top-[74px] lg:self-start">
          <div className="overflow-hidden rounded-[10px] border border-hairline bg-canvas">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="text-[14px] font-semibold">Leaderboard</span>
              <span className="text-[11.5px] text-fg-muted">fastest first</span>
            </div>
            <div className="space-y-1.5 p-3">
              {board.length === 0 ? (
                <p className="px-1 py-4 text-center text-[13px] text-fg-muted">
                  No one has solved this yet.
                </p>
              ) : (
                board.map((b, i) => {
                  const me = b.user_id === user.id;
                  const delta = fastest != null ? b.best_time - fastest : 0;
                  return (
                    <div
                      key={b.user_id}
                      className={cn(
                        "flex items-center gap-3 rounded-[7px] px-3 py-2 text-[13.5px]",
                        me ? "bg-accent-weak" : "bg-canvas",
                      )}
                    >
                      {i < 3 ? (
                        <RankMedal rank={i + 1} className="h-7 w-auto shrink-0" />
                      ) : (
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-hairline-strong text-[11px] font-bold text-white">
                          {i + 1}
                        </span>
                      )}
                      <span className="flex-1 truncate font-medium">
                        {me ? <span className="font-semibold text-accent">You</span> : b.name}
                      </span>
                      <span className="tnum text-[12.5px] font-medium">
                        {formatClock(b.best_time)}
                      </span>
                      <span className="tnum hidden w-14 text-right text-[11.5px] text-fg-muted sm:inline">
                        {i === 0 ? "fastest" : `+${formatClock(delta)}`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[10px] border border-hairline bg-canvas p-4">
      <div className="text-[12px] text-fg-muted">{label}</div>
      <div className="mt-1 text-[22px] font-semibold tracking-[-0.01em]">
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-fg-faint">{hint}</div>
    </div>
  );
}
