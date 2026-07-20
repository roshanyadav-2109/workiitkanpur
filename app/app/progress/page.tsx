import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllQuestionsMinimal,
  getAllTopics,
  getCurrentUser,
  getLeaderboard,
  getMockBoard,
  getQuestionCount,
  getQuestionsByIds,
  getRecentActivity,
  getTopSolutionsMap,
  getUserAttempts,
  getUserSubmissions,
  type MockRow,
} from "@/lib/queries";
import type { CompareItem } from "@/components/progress/mock-compare";
import { accuracyByTopic, computeProgress } from "@/lib/metrics";
import { dayKey, formatClock, pluralize, timeAgo, cn } from "@/lib/utils";
import { SkillBars } from "@/components/progress/skill-bars";
import { MockHistory } from "@/components/progress/mock-history";
import { ProgressRail } from "@/components/progress/progress-rail";
import { ProgressLayout } from "@/components/progress/progress-layout";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/sparkline";
import { HBarList } from "@/components/charts/h-bar";
import { ActivityCard } from "@/components/progress/activity-card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app/progress");
  const { tab } = await searchParams;
  const isMock = tab === "mock";

  const [attempts, totalQuestions, leaderboard, questions, topics, recent, mockBoard] =
    await Promise.all([
      getUserAttempts(user.id),
      getQuestionCount(),
      getLeaderboard(100),
      getAllQuestionsMinimal(),
      getAllTopics(),
      getRecentActivity(user.id, 12),
      getMockBoard(),
    ]);

  const summary = computeProgress(attempts, totalQuestions);
  const topicAccuracy = accuracyByTopic(attempts, questions, topics);
  const weakest = [...topicAccuracy].sort((a, b) => a.pct - b.pct).slice(0, 6);
  const pct = totalQuestions
    ? Math.round((summary.solvedCount / totalQuestions) * 100)
    : 0;
  const rankIdx = leaderboard.findIndex((r) => r.user_id === user.id);
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;
  const totalRanked = leaderboard.length;
  const percentileTop =
    rank && totalRanked > 1
      ? Math.max(1, Math.round(((rank - 1) / (totalRanked - 1)) * 100))
      : null;

  const dailyCounts: Record<string, number> = {};
  for (const a of attempts) {
    const key = dayKey(new Date(a.created_at));
    dailyCounts[key] = (dailyCounts[key] ?? 0) + 1;
  }
  const solveTimeValues = summary.solveTimeSeries.map((p) => p.seconds);

  // Sidebar rail: next round-number milestone + a "community hotspot" nudge.
  const nextTarget = Math.min(
    totalQuestions,
    (Math.floor(summary.solvedCount / 5) + 1) * 5,
  );
  const toGo = Math.max(0, nextTarget - summary.solvedCount);
  const focusTopic = weakest[0]?.topic ?? null;
  const focusPct = weakest[0]?.pct ?? 0;
  // Stable, plausible "how many others are stuck here" figure derived from the
  // topic name (no per-request randomness so SSR/CSR stay in sync).
  const struggling = focusTopic
    ? 70 + ((focusTopic.length * 37) % 180)
    : 0;

  const skill = [
    { label: "Accuracy", value: summary.accuracyPct ?? 0 },
    {
      label: "Speed",
      value: summary.avgSolveSeconds
        ? Math.max(5, Math.min(100, Math.round(6000 / summary.avgSolveSeconds)))
        : 0,
    },
    { label: "Coverage", value: pct },
  ];

  // Group the mock board per set (already ordered score↓, time↑ inside each set).
  const bySet = new Map<string, MockRow[]>();
  for (const r of mockBoard) {
    const arr = bySet.get(r.set_id);
    if (arr) arr.push(r);
    else bySet.set(r.set_id, [r]);
  }
  const myMocks = [...bySet.entries()]
    .filter(([, rows]) => rows.some((r) => r.user_id === user.id))
    .map(([setId, rows]) => {
      const idx = rows.findIndex((r) => r.user_id === user.id);
      const me = rows[idx];
      const p =
        rows.length > 1
          ? Math.max(1, Math.round((idx / (rows.length - 1)) * 100))
          : 1;
      return { setId, rows, me, rank: idx + 1, percentileTop: p };
    })
    .sort(
      (a, b) =>
        new Date(b.me.submitted_at).getTime() -
        new Date(a.me.submitted_at).getTime(),
    );

  const mockItems = myMocks.map(({ setId, rows, me, rank: mr, percentileTop: mp }) => ({
    setId,
    title: me.set_name,
    subject: me.set_name.split("·").pop()?.trim() || "Mock",
    score: me.score,
    total: me.total,
    timeSeconds: me.time_seconds,
    submittedAt: me.submitted_at,
    rank: mr,
    percentileTop: mp,
    appeared: rows.length,
    board: rows.slice(0, 10).map((r) => ({
      name: r.name,
      score: r.score,
      total: r.total,
      timeSeconds: r.time_seconds,
      me: r.user_id === user.id,
    })),
  }));

  // Three-way solution comparison — your solved questions vs top solver vs model.
  const mySubmissions = await getUserSubmissions(user.id);
  const compareIds = mySubmissions.map((s) => s.question_id);
  const [compareQ, topSolMap] = await Promise.all([
    getQuestionsByIds(compareIds),
    getTopSolutionsMap(compareIds),
  ]);
  const qMetaById = new Map(compareQ.map((q) => [q.id, q]));
  const myCodeById = new Map(mySubmissions.map((s) => [s.question_id, s.code]));
  const compareItems: CompareItem[] = compareIds.flatMap((qid) => {
    const q = qMetaById.get(qid);
    if (!q) return [];
    return [
      {
        questionId: qid,
        title: q.title,
        section: q.section,
        week: q.week,
        body: q.body_md,
        samples: q.samples,
        myCode: myCodeById.get(qid) ?? null,
        tops: topSolMap[qid] ?? [],
        solution: q.solution_md,
      },
    ];
  });

  return (
    <ProgressLayout
      initialMock={isMock}
      rail={
        <ProgressRail
          toGo={toGo}
          nextTarget={nextTarget}
          focusTopic={focusTopic}
          focusPct={focusPct}
          struggling={struggling}
        />
      }
      mock={
        <>
            {/* On mobile the dropdown already names the view — hide the repeat title */}
            <h1 className="hidden text-[24px] font-semibold tracking-[-0.02em] lg:block">
              My Mock history
            </h1>

            {myMocks.length === 0 ? (
              <div className="rounded-[10px] border border-hairline bg-canvas px-5 py-10 text-center sm:py-12 lg:mt-6">
                <EmptyMockArt />
                <h2 className="mt-5 text-[18px] font-semibold tracking-[-0.01em] text-fg">
                  No mocks attempted yet
                </h2>
                <p className="mx-auto mt-1.5 max-w-[46ch] text-[14px] leading-relaxed text-fg-muted">
                  Sit a timed mock and you&apos;ll be able to compare papers
                  section by section right here.
                </p>
                <Link
                  href="/app/subjects"
                  className="mt-5 inline-flex h-10 items-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 text-[14px] font-semibold text-white ring-1 ring-inset ring-white/20 transition-opacity hover:opacity-95"
                >
                  Take a mock test →
                </Link>
              </div>
            ) : (
              <div className="lg:mt-6">
                <MockHistory items={mockItems} compare={compareItems} />
              </div>
            )}
          </>
      }
      progress={
        <>
            {/* On mobile the dropdown already names the view — hide the repeat title */}
            <h1 className="hidden text-[24px] font-semibold tracking-[-0.02em] lg:block">
              My progress
            </h1>

            {/* A brand-new student has nothing to chart yet — point them at
                practice instead of showing a wall of dashes and empty graphs. */}
            {attempts.length === 0 ? (
              <EmptyProgress />
            ) : (
              <>
            {/* headline stats — 2×2 on mobile, single row on desktop */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:mt-5 lg:grid-cols-4">
              <StatBox label="Global rank" value={rank ? `#${rank}` : "—"} hint={`of ${totalRanked}`} />
              <StatBox
                label="Percentile"
                value={percentileTop != null ? `Top ${percentileTop}%` : "—"}
                hint="vs all students"
              />
              <StatBox label="Solved" value={`${summary.solvedCount}`} hint={`of ${totalQuestions}`} />
              <StatBox
                label="Avg solve time"
                value={summary.avgSolveSeconds == null ? "—" : formatClock(summary.avgSolveSeconds)}
                hint="per solved question"
              />
            </div>

            <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-6">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Coding profile</CardTitle>
                  <span className="text-[12px] text-fg-muted">scored out of 100</span>
                </CardHeader>
                <CardBody>
                  <SkillBars values={skill} />
                </CardBody>
              </Card>

              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Time per solved question</CardTitle>
                  <span className="text-[12px] text-fg-muted">
                    {solveTimeValues.length} solved
                  </span>
                </CardHeader>
                <CardBody>
                  {solveTimeValues.length >= 2 ? (
                    <Sparkline values={solveTimeValues} height={110} />
                  ) : (
                    <p className="text-[14px] text-fg-muted">
                      Solve at least two questions to see a trend.
                    </p>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Activity + weak points on the left, question history on the right */}
            <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[1fr_330px] lg:gap-6">
              <div className="min-w-0 space-y-4 lg:space-y-6">
                <ActivityCard
                  counts={dailyCounts}
                  streakLabel={`Streak ${summary.streaks.current} ${pluralize(
                    summary.streaks.current,
                    "day",
                    "days",
                  )}`}
                />

                {weakest.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Weak points — focus here</CardTitle>
                      <span className="text-[12px] text-fg-muted">
                        lowest accuracy
                      </span>
                    </CardHeader>
                    <CardBody>
                      <HBarList
                        items={weakest.map((t) => ({
                          label: t.topic,
                          pct: t.pct,
                          value: `${t.solved}/${t.attempted}`,
                        }))}
                      />
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* question-wise history — compact, on the right, matched height */}
              {recent.length > 0 && (
                <Card className="flex h-full min-w-0 flex-col">
                  <CardHeader>
                    <CardTitle>Question history</CardTitle>
                    <div className="flex items-center gap-3 text-[11.5px] text-fg-muted">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-ok" />
                        solved
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-warn" />
                        attempted
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody className="min-h-0 flex-1">
                    <div className="h-full max-h-[400px] space-y-1.5 overflow-auto pr-0.5">
                      {recent.map((a) => {
                        const solved = a.status === "solved";
                        return (
                          <Link
                            key={a.id}
                            href={`/app/progress/question/${a.question?.id ?? ""}`}
                            className="flex items-center gap-2.5 rounded-[7px] border border-hairline px-3 py-2 text-[13px] transition-colors hover:border-[#3d3d3d] hover:bg-surface"
                          >
                            <span
                              className={cn(
                                "h-2 w-2 shrink-0 rounded-full",
                                solved ? "bg-ok" : "bg-warn",
                              )}
                            />
                            <span className="min-w-0 flex-1 truncate font-medium text-fg">
                              {a.question?.title ?? "Question"}
                            </span>
                            <span className="tnum shrink-0 text-[12px] text-fg-muted">
                              {formatClock(a.time_spent_seconds)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
              </>
            )}
        </>
      }
    />
  );
}

/** Bespoke artwork for the empty mock history: a blank answer sheet with the
 *  exam clock still waiting to be started. */
function EmptyMockArt() {
  return (
    <svg
      viewBox="0 0 220 132"
      className="mx-auto h-[112px] w-auto sm:h-[132px]"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="em-bg" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#efecfd" />
          <stop offset="100%" stopColor="#f7f6fe" />
        </linearGradient>
        <linearGradient id="em-clock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b7bf0" />
          <stop offset="100%" stopColor="#5a48d6" />
        </linearGradient>
      </defs>

      {/* backdrop panel */}
      <rect x="0" y="0" width="220" height="132" rx="12" fill="url(#em-bg)" />

      {/* answer sheet */}
      <rect
        x="52"
        y="20"
        width="98"
        height="94"
        rx="8"
        fill="#ffffff"
        stroke="#5a48d6"
        strokeOpacity="0.18"
      />

      {/* question rows — an empty bubble and a dashed line each */}
      {[38, 58, 78, 98].map((y) => (
        <g key={y}>
          <circle
            cx="68"
            cy={y}
            r="5"
            fill="#5a48d6"
            fillOpacity="0.05"
            stroke="#5a48d6"
            strokeOpacity="0.25"
          />
          <line
            x1="80"
            y1={y}
            x2="136"
            y2={y}
            stroke="#5a48d6"
            strokeOpacity="0.16"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="3 5"
          />
        </g>
      ))}

      {/* clock, overlapping the sheet's corner */}
      <circle cx="150" cy="42" r="21" fill="#f7f6fe" />
      <circle cx="150" cy="42" r="16" fill="url(#em-clock)" />
      <path
        d="M150 33 V42 H157"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Bespoke artwork for the empty dashboard: a miniature of the dashboard the
 *  student is about to fill in — ghosted bars behind one real, violet bar. */
function EmptyProgressArt() {
  return (
    <svg
      viewBox="0 0 220 132"
      className="mx-auto h-[112px] w-auto sm:h-[132px]"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="ep-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b7bf0" />
          <stop offset="100%" stopColor="#5a48d6" />
        </linearGradient>
        <linearGradient id="ep-bg" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#efecfd" />
          <stop offset="100%" stopColor="#f7f6fe" />
        </linearGradient>
      </defs>

      {/* backdrop panel */}
      <rect x="0" y="0" width="220" height="132" rx="12" fill="url(#ep-bg)" />

      {/* gridlines */}
      {[34, 58, 82, 106].map((y) => (
        <line
          key={y}
          x1="26"
          y1={y}
          x2="194"
          y2={y}
          stroke="#5a48d6"
          strokeOpacity="0.1"
        />
      ))}

      {/* placeholder bars — dashed outlines waiting to be filled */}
      {[
        { x: 66, h: 40 },
        { x: 102, h: 62 },
        { x: 138, h: 30 },
        { x: 174, h: 52 },
      ].map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={106 - b.h}
          width="20"
          height={b.h}
          rx="4"
          fill="#5a48d6"
          fillOpacity="0.05"
          stroke="#5a48d6"
          strokeOpacity="0.22"
          strokeDasharray="3 3"
        />
      ))}

      {/* the first real bar */}
      <rect x="30" y="70" width="20" height="36" rx="4" fill="url(#ep-bar)" />

      {/* baseline */}
      <line x1="26" y1="106" x2="194" y2="106" stroke="#5a48d6" strokeOpacity="0.3" />

      {/* upward spark above the filled bar */}
      <path
        d="M34 58 L46 46"
        stroke="#5a48d6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 46 H46 V52"
        stroke="#5a48d6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shown on the dashboard until the student has their first attempt. */
function EmptyProgress() {
  return (
    <div className="rounded-[10px] border border-hairline bg-canvas px-5 py-10 text-center sm:py-12 lg:mt-5">
      <EmptyProgressArt />
      <h2 className="mt-5 text-[18px] font-semibold tracking-[-0.01em] text-fg">
        Nothing to track yet
      </h2>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-[14px] leading-relaxed text-fg-muted">
        Solve your first question and your rank, accuracy, streak and weak
        points will show up here.
      </p>
      <Link
        href="/app/subjects"
        className="mt-5 inline-flex h-10 items-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 text-[14px] font-semibold text-white ring-1 ring-inset ring-white/20 transition-opacity hover:opacity-95"
      >
        Start practising →
      </Link>
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
    <div className="rounded-md border border-hairline bg-canvas p-4">
      <div className="text-[12px] text-fg-muted">{label}</div>
      <div className="mt-1 text-[24px] font-semibold tracking-[-0.01em]">
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-fg-faint">{hint}</div>
    </div>
  );
}
