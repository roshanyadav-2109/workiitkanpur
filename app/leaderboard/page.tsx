import type { ReactNode } from "react";
import Link from "next/link";
import {
  getCurrentUser,
  getLeaderboard,
  getQuestionCount,
  getUserAttempts,
} from "@/lib/queries";
import { computeProgress } from "@/lib/metrics";
import { TopNav } from "@/components/shell/top-nav";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { PosterCarousel } from "@/components/marketing/poster-carousel";
import { SkillBars } from "@/components/progress/skill-bars";
import { RankMedal } from "@/components/progress/rank-medal";
import { buttonVariants } from "@/components/ui/button";
import { formatClock, formatDurationHuman, cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Leaderboard",
  description:
    "See the fastest solvers on IITM BS Community. Race the clock on OPPE practice questions and climb the IIT Madras BS Degree leaderboard.",
  path: "/leaderboard",
  keywords: [
    "OPPE leaderboard",
    "IITM BS leaderboard",
    "fastest solvers",
    "IIT Madras BS ranking",
  ],
});

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
      <TopNav right={<ProfileMenu />} />

      <main className="w-full flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
        <div className="grid gap-5 lg:grid-cols-[230px_1fr_310px]">
          {/* LEFT — marketing poster carousel (hidden on mobile) */}
          <aside className="order-3 hidden lg:order-1 lg:block lg:sticky lg:top-[74px] lg:self-start">
            <PosterCarousel />
          </aside>

          {/* MIDDLE — leaderboard, each student an independent block */}
          <section className="order-1 min-w-0 lg:order-2">
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
          <aside className="order-2 flex min-w-0 flex-col lg:order-3 lg:sticky lg:top-[74px] lg:h-[85vh] lg:self-start">
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
              <div className="flex flex-col rounded-[10px] border-2 border-[#3d3d3d] bg-canvas p-3 lg:h-[81%]">
                {/* violet header — inset, matches the logged-in card */}
                <div className="relative overflow-hidden rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 py-5 text-white">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-3 -top-5 select-none text-[88px] leading-none text-white/10"
                  >
                    ◎
                  </span>
                  <h2 className="relative text-[17px] font-semibold">
                    Track your progress
                  </h2>
                  <p className="relative mt-1 text-[13px] text-white/85">
                    Sign in to see where you stand against everyone.
                  </p>
                </div>

                {/* what you unlock */}
                <div className="flex flex-1 flex-col px-2 pt-4">
                  <ul className="space-y-3">
                    <Perk>Your live rank &amp; percentile</Perk>
                    <Perk>Solved count across every subject</Perk>
                    <Perk>Daily streak &amp; activity heatmap</Perk>
                    <Perk>Per-question detailed analysis</Perk>
                  </ul>

                  {/* custom podium artifact */}
                  <div className="flex flex-1 items-center justify-center py-3">
                    <svg
                      viewBox="0 0 220 120"
                      className="w-[80%] max-w-[210px]"
                      aria-hidden
                    >
                      <defs>
                        <linearGradient id="lbPodium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#8b7bf0" />
                          <stop offset="1" stopColor="#5a48d6" />
                        </linearGradient>
                      </defs>
                      {/* confetti */}
                      <circle cx="60" cy="9" r="1.8" fill="#5a48d6" opacity="0.5" />
                      <circle cx="120" cy="6" r="1.8" fill="#f5c542" />
                      <circle cx="185" cy="20" r="2.2" fill="#f5c542" />
                      <rect x="30" y="14" width="4" height="4" rx="1" fill="#8b7bf0" transform="rotate(20 32 16)" />
                      <rect x="150" y="10" width="4" height="4" rx="1" fill="#5a48d6" opacity="0.5" transform="rotate(-15 152 12)" />
                      {/* crown on the winner */}
                      <g>
                        {/* body with three points */}
                        <path
                          d="M97,40 L100,25 L106,33 L110,20 L114,33 L120,25 L123,40 Z"
                          fill="#ffd75e"
                          stroke="#d99400"
                          strokeWidth="0.9"
                          strokeLinejoin="round"
                        />
                        {/* band */}
                        <rect x="95" y="39.5" width="30" height="6.5" rx="2" fill="#f5c542" stroke="#d99400" strokeWidth="0.8" />
                        {/* band gems */}
                        <circle cx="103" cy="42.8" r="1.3" fill="#5a48d6" />
                        <circle cx="110" cy="42.8" r="1.5" fill="#d1344b" />
                        <circle cx="117" cy="42.8" r="1.3" fill="#5a48d6" />
                        {/* pearl tips */}
                        <circle cx="100" cy="24" r="2.3" fill="#ffe595" stroke="#d99400" strokeWidth="0.7" />
                        <circle cx="110" cy="19" r="2.7" fill="#ffe595" stroke="#d99400" strokeWidth="0.7" />
                        <circle cx="120" cy="24" r="2.3" fill="#ffe595" stroke="#d99400" strokeWidth="0.7" />
                      </g>
                      {/* podium blocks (2nd / 1st / 3rd) */}
                      <rect x="25" y="68" width="54" height="42" rx="3" fill="#d7d0f5" />
                      <rect x="141" y="80" width="54" height="30" rx="3" fill="#e7e2f8" />
                      <rect x="83" y="52" width="54" height="58" rx="3" fill="url(#lbPodium)" />
                      {/* ground */}
                      <line x1="18" y1="110" x2="202" y2="110" stroke="#e7e2f8" strokeWidth="2" strokeLinecap="round" />
                      {/* ranks */}
                      <text x="52" y="95" textAnchor="middle" fontSize="16" fontWeight="800" fill="#5a48d6">2</text>
                      <text x="110" y="87" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">1</text>
                      <text x="168" y="100" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7b6ce0">3</text>
                    </svg>
                  </div>

                  <div className="space-y-2">
                    <Link
                      href="/login?next=/leaderboard"
                      className={cn(
                        buttonVariants({ variant: "primary", size: "md" }),
                        "w-full",
                      )}
                    >
                      Sign in →
                    </Link>
                  </div>
                </div>
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

function Perk({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px] text-fg">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-weak text-accent">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5 L10 17.5 L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </li>
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
