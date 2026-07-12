import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getCurrentUser,
  getQuestionById,
  getQuestionLeaderboard,
} from "@/lib/queries";
import { Markdown } from "@/components/markdown";
import { RankMedal } from "@/components/progress/rank-medal";
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
  const board = await getQuestionLeaderboard(id, 10);

  const times = board.map((b) => b.best_time);
  const fastest = times.length ? Math.min(...times) : null;
  const avg = times.length
    ? Math.round(times.reduce((s, t) => s + t, 0) / times.length)
    : null;
  const myIdx = board.findIndex((b) => b.user_id === user.id);
  const myTime = myIdx >= 0 ? board[myIdx].best_time : null;

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <div className="mb-2 text-[12px] text-fg-muted">
        <Link href="/app/progress" className="hover:text-fg">
          ← My progress
        </Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">
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

      {/* Time comparison */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
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

      {/* Top-10 leaderboard for this question */}
      <div className="mt-8">
        <h2 className="text-[16px] font-semibold">Top solvers</h2>
        <p className="text-[13px] text-fg-muted">
          Fastest correct solutions — see who cracked it quickest.
        </p>
        {board.length === 0 ? (
          <p className="mt-4 text-[14px] text-fg-muted">
            No one has solved this yet — be the first.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {board.map((b, i) => {
              const me = b.user_id === user.id;
              const delta =
                fastest != null ? b.best_time - fastest : 0;
              return (
                <div
                  key={b.user_id}
                  className={cn(
                    "flex items-center gap-4 rounded-[4px] border-2 border-[#3d3d3d] px-4 py-3 text-[14px]",
                    me ? "bg-accent-weak" : "bg-canvas",
                  )}
                >
                  <span className="flex w-9 justify-center">
                    {i < 3 ? (
                      <RankMedal rank={i + 1} className="h-8 w-auto" />
                    ) : (
                      <span className="tnum text-fg-muted">{i + 1}</span>
                    )}
                  </span>
                  <span className="flex-1 truncate font-medium">
                    {b.name}
                    {me && (
                      <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        You
                      </span>
                    )}
                  </span>
                  <span className="tnum w-16 text-right font-medium">
                    {formatClock(b.best_time)}
                  </span>
                  <span className="tnum hidden w-20 text-right text-[12px] text-fg-muted sm:inline">
                    {i === 0 ? "fastest" : `+${formatClock(delta)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Model approach — how it's solved */}
      {ctx.question.solution_md && (
        <div className="mt-8">
          <h2 className="text-[16px] font-semibold">
            How the toppers approach it
          </h2>
          <p className="text-[13px] text-fg-muted">
            A clean, model solution — study the approach, then beat their time.
          </p>
          <div className="prose-oppe mt-4 rounded-[10px] border-2 border-[#3d3d3d] bg-canvas p-5">
            <Markdown>{ctx.question.solution_md}</Markdown>
          </div>
        </div>
      )}
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
    <div className="rounded-[10px] border-2 border-[#3d3d3d] bg-canvas p-4">
      <div className="text-[12px] text-fg-muted">{label}</div>
      <div className="mt-1 text-[24px] font-semibold tracking-[-0.01em]">
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-fg-faint">{hint}</div>
    </div>
  );
}
