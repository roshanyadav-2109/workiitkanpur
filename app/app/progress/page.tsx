import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllQuestionsMinimal,
  getAllTopics,
  getCurrentUser,
  getQuestionCount,
  getUserAttempts,
} from "@/lib/queries";
import { accuracyByTopic, computeProgress } from "@/lib/metrics";
import { dayKey, formatClock, formatDurationHuman, pluralize } from "@/lib/utils";
import { PageHeader, StatGrid, StatCell } from "@/components/shell/page-header";
import { Stat } from "@/components/ui/stat";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { BarColumnChart } from "@/components/charts/bar-column";
import { Sparkline } from "@/components/charts/sparkline";
import { StreakCalendar } from "@/components/charts/streak-calendar";
import { HBarList } from "@/components/charts/h-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app/progress");

  const [attempts, totalQuestions, questions, topics] = await Promise.all([
    getUserAttempts(user.id),
    getQuestionCount(),
    getAllQuestionsMinimal(),
    getAllTopics(),
  ]);

  const summary = computeProgress(attempts, totalQuestions);
  const topicAccuracy = accuracyByTopic(attempts, questions, topics);

  const dailyCounts: Record<string, number> = {};
  for (const a of attempts) {
    const key = dayKey(new Date(a.created_at));
    dailyCounts[key] = (dailyCounts[key] ?? 0) + 1;
  }

  if (attempts.length === 0) {
    return (
      <>
        <PageHeader
          title="Progress"
          description="Your growth over time — solved counts, times, accuracy, and streaks."
        />
        <EmptyState
          title="No data yet"
          description="Attempt and solve a few questions and this page fills in with your trends."
          action={
            <Link
              href="/app/subjects"
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              Start practicing
            </Link>
          }
        />
      </>
    );
  }

  const solveTimeValues = summary.solveTimeSeries.map((p) => p.seconds);

  return (
    <>
      <PageHeader
        title="Progress"
        description="Your growth over time — solved counts, times, accuracy, and streaks."
      />

      <StatGrid>
        <StatCell>
          <Stat
            label="Solved"
            focal
            value={summary.solvedCount}
            hint={`of ${totalQuestions}`}
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Attempted"
            value={summary.attemptedCount}
            hint="distinct questions"
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Longest streak"
            value={summary.streaks.longest}
            hint={pluralize(summary.streaks.longest, "day", "days")}
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Avg solve time"
            value={
              summary.avgSolveSeconds === null
                ? "—"
                : formatClock(summary.avgSolveSeconds)
            }
            hint="per solved question"
          />
        </StatCell>
      </StatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <span className="text-[12px] text-fg-muted">
              Current streak {summary.streaks.current}{" "}
              {pluralize(summary.streaks.current, "day", "days")}
            </span>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <StreakCalendar counts={dailyCounts} weeks={14} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-[12px] text-fg-muted">
              <span>Less</span>
              <span className="h-[11px] w-[11px] rounded-[2px] border border-hairline" />
              <span
                className="h-[11px] w-[11px] rounded-[2px] bg-accent"
                style={{ opacity: 0.32 }}
              />
              <span
                className="h-[11px] w-[11px] rounded-[2px] bg-accent"
                style={{ opacity: 0.5 }}
              />
              <span
                className="h-[11px] w-[11px] rounded-[2px] bg-accent"
                style={{ opacity: 0.7 }}
              />
              <span className="h-[11px] w-[11px] rounded-[2px] bg-accent" />
              <span>More</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time per solved question</CardTitle>
            <span className="text-[12px] text-fg-muted">
              {solveTimeValues.length} solved
            </span>
          </CardHeader>
          <CardBody>
            {solveTimeValues.length >= 2 ? (
              <>
                <Sparkline values={solveTimeValues} height={72} />
                <div className="mt-4 flex items-center gap-6 text-[13px]">
                  <span className="text-fg-muted">
                    Fastest{" "}
                    <span className="font-medium tnum text-fg">
                      {formatClock(Math.min(...solveTimeValues))}
                    </span>
                  </span>
                  <span className="text-fg-muted">
                    Average{" "}
                    <span className="font-medium tnum text-fg">
                      {formatClock(summary.avgSolveSeconds ?? 0)}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[14px] text-fg-muted">
                Solve at least two questions to see a trend.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Solved — last 14 days</CardTitle>
          <span className="text-[12px] tnum text-fg-muted">
            {summary.solvedPerDay.reduce((s, d) => s + d.count, 0)} total
          </span>
        </CardHeader>
        <CardBody>
          <BarColumnChart
            data={summary.solvedPerDay.map((d) => ({
              label: d.label.slice(0, 2),
              sublabel: d.key,
              value: d.count,
            }))}
          />
        </CardBody>
      </Card>

      {topicAccuracy.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Accuracy by topic</CardTitle>
            <span className="text-[12px] text-fg-muted">solved / attempted</span>
          </CardHeader>
          <CardBody>
            <HBarList
              items={topicAccuracy.map((t) => ({
                label: t.topic,
                pct: t.pct,
                value: `${t.solved}/${t.attempted}`,
              }))}
            />
          </CardBody>
        </Card>
      )}
    </>
  );
}
