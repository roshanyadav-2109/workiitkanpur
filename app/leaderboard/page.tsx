import type { Metadata } from "next";
import Link from "next/link";
import {
  getCurrentUser,
  getLeaderboard,
  getQuestionCount,
  getUserAttempts,
} from "@/lib/queries";
import { computeProgress } from "@/lib/metrics";
import { TopNav } from "@/components/shell/top-nav";
import { PosterCarousel } from "@/components/marketing/poster-carousel";
import { SkillBars } from "@/components/progress/skill-bars";
import { RankMedal } from "@/components/progress/rank-medal";
import { buttonVariants } from "@/components/ui/button";
import { formatClock, formatDurationHuman, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const [rows, attempts, totalQuestions] = await Promise.all([
    getLeaderboard(100),
    user ? getUserAttempts(user.id) : Promise.resolve([]),
    getQuestionCount(),
  ]);

  const summary = user ? computeProgress(attempts, totalQuestions) : null;
  const pct =
    summary && totalQuestions
      ? Math.round((summary.solvedCount / totalQuestions) * 100)
      : 0;
  const rankIdx = user ? rows.findIndex((r) => r.user_id === user.id) : -1;
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;
  const percentileTop =
    rank && rows.length > 1
      ? Math.max(1, Math.round(((rank - 1) / (rows.length - 1)) * 100))
      : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav
        right={
          user ? (
            <Link
              href="/app/progress"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                Sign up
              </Link>
            </>
          )
        }
      />

      <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid gap-5 lg:grid-cols-[230px_1fr_310px]">
          {/* LEFT — marketing poster carousel */}
          <aside className="order-3 lg:order-1 lg:sticky lg:top-[74px] lg:self-start">
            <PosterCarousel />
          </aside>

          {/* MIDDLE — leaderboard, each student an independent block */}
          <section className="order-1 lg:order-2">
            <div className="mb-3 flex items-center justify-between px-1">
              <h1 className="text-[18px] font-semibold tracking-[-0.01em]">
                Leaderboard
              </h1>
              <span className="text-[12px] text-fg-muted">
                by solved, then fastest time
              </span>
            </div>

            {rows.length === 0 ? (
              <p className="mt-8 text-[14px] text-fg-muted">
                No one has made the board yet. Solve a few questions to claim the
                top spot.
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((r, i) => {
                  const me = user?.id === r.user_id;
                  return (
                    <div
                      key={r.user_id}
                      className={cn(
                        "flex items-center gap-4 rounded-[4px] border-2 border-[#3d3d3d] px-4 py-3 text-[14px]",
                        me ? "bg-accent-weak" : "bg-canvas",
                      )}
                    >
                      <span className="flex w-8 justify-center">
                        {i < 3 ? (
                          <RankMedal rank={i + 1} />
                        ) : (
                          <span className="tnum text-fg-muted">{i + 1}</span>
                        )}
                      </span>
                      <span className="flex-1 truncate font-medium text-fg">
                        {r.name}
                        {me && (
                          <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            You
                          </span>
                        )}
                      </span>
                      <span className="tnum w-16 text-right text-fg">
                        {r.solved}
                      </span>
                      <span className="w-12 text-right text-[12px] text-fg-muted">
                        solved
                      </span>
                      <span className="tnum w-20 text-right text-[13px] text-fg-muted">
                        {formatDurationHuman(r.total_seconds)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* RIGHT — your progress (or a sign-in prompt) + promo */}
          <aside className="order-2 flex flex-col lg:order-3 lg:sticky lg:top-[74px] lg:h-[85vh] lg:self-start">
            {summary ? (
              <div className="flex flex-col rounded-[10px] border-2 border-[#3d3d3d] bg-canvas p-3 lg:h-[81%]">
                {/* purple padded section — header, solved bar, stat blocks */}
                <div className="rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-semibold">Your progress</h2>
                    {rank && (
                      <span className="rounded-[6px] bg-white/20 px-2.5 py-0.5 text-[12px] font-semibold text-white">
                        Rank #{rank}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[13px] text-white/85">Solved</span>
                      <span className="tnum text-[13px] text-white">
                        <span className="text-[18px] font-semibold">
                          {summary.solvedCount}
                        </span>{" "}
                        / {totalQuestions}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
                      <div className="h-full bg-white" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    <MiniStat
                      label="Percentile"
                      value={percentileTop != null ? `Top ${percentileTop}%` : "—"}
                    />
                    <MiniStat
                      label="Attempted"
                      value={`${summary.attemptedCount}`}
                    />
                    <MiniStat
                      label="Avg time"
                      value={
                        summary.avgSolveSeconds == null
                          ? "—"
                          : formatClock(summary.avgSolveSeconds)
                      }
                    />
                  </div>
                </div>

                {/* Coding profile — "your aukaat" (on white, outside purple) */}
                <div className="mt-4">
                  <SkillBars
                    values={[
                      { label: "Accuracy", value: summary.accuracyPct ?? 0 },
                      {
                        label: "Speed",
                        value: summary.avgSolveSeconds
                          ? Math.max(
                              5,
                              Math.min(
                                100,
                                Math.round(6000 / summary.avgSolveSeconds),
                              ),
                            )
                          : 0,
                      },
                      { label: "Coverage", value: pct },
                    ]}
                  />
                </div>

                <Link
                  href="/app/progress"
                  className={cn(
                    buttonVariants({ variant: "primary", size: "md" }),
                    "mt-auto w-full",
                  )}
                >
                  View detailed Analysis →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col justify-center rounded-[10px] border-2 border-[#3d3d3d] bg-canvas p-5 text-center lg:h-[81%]">
                <h2 className="text-[16px] font-semibold">Track your progress</h2>
                <p className="mt-1.5 text-[13px] text-fg-muted">
                  Sign in to see your rank, percentile and solved count.
                </p>
                <Link
                  href="/login?next=/leaderboard"
                  className={cn(
                    buttonVariants({ variant: "primary", size: "md" }),
                    "mt-4",
                  )}
                >
                  Sign in →
                </Link>
              </div>
            )}

            {/* single static promo frame — 20% */}
            <div
              className="mt-4 flex items-center justify-between gap-3 overflow-hidden rounded-[10px] px-5 py-4 text-white lg:mt-2 lg:h-[17%]"
              style={{ background: "linear-gradient(160deg,#e0510e,#7c2d12)" }}
            >
              <div>
                <div className="text-[14px] font-bold leading-tight">
                  Ready for the real thing?
                </div>
                <p className="text-[12px] text-white/80">Sit a full timed mock.</p>
              </div>
              <Link
                href="/app/subjects"
                className="inline-flex h-8 shrink-0 items-center rounded-[8px] bg-white px-3 text-[12.5px] font-semibold text-fg"
              >
                Start →
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#3d3d3d] bg-canvas p-3">
      <div className="text-[11.5px] font-normal text-fg">{label}</div>
      <div className="mt-0.5 text-[15px] font-normal tracking-[-0.01em] text-fg">
        {value}
      </div>
    </div>
  );
}
