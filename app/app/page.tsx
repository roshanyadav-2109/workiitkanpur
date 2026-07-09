import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllQuestionsMinimal,
  getCurrentUser,
  getQuestionCount,
  getRecentActivity,
  getSubjects,
  getUserAttempts,
} from "@/lib/queries";
import { computeProgress, statusByQuestion } from "@/lib/metrics";
import { PageHeader, StatGrid, StatCell } from "@/components/shell/page-header";
import { Stat } from "@/components/ui/stat";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { BarColumnChart } from "@/components/charts/bar-column";
import { StatusIndicator } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { IconChevron } from "@/components/icons";
import {
  formatClock,
  formatDurationHuman,
  pluralize,
  timeAgo,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app");

  const [attempts, totalQuestions, recent, subjects, questions] =
    await Promise.all([
      getUserAttempts(user.id),
      getQuestionCount(),
      getRecentActivity(user.id, 7),
      getSubjects(),
      getAllQuestionsMinimal(),
    ]);

  const summary = computeProgress(attempts, totalQuestions);
  const status = statusByQuestion(attempts);

  const activeSubjects = subjects
    .filter((s) => s.is_active)
    .map((s) => {
      const subjectQuestions = questions.filter((q) => q.subject_id === s.id);
      const solved = subjectQuestions.filter(
        (q) => status.get(q.id) === "solved",
      ).length;
      return { subject: s, total: subjectQuestions.length, solved };
    });

  const hasActivity = attempts.length > 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          hasActivity
            ? `You've solved ${summary.solvedCount} of ${totalQuestions} questions so far.`
            : "Your practice starts here. Pick a subject and time your first attempt."
        }
      />

      <StatGrid>
        <StatCell>
          <Stat
            label="Solved"
            focal
            value={summary.solvedCount}
            hint={`of ${totalQuestions} questions`}
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Current streak"
            value={summary.streaks.current}
            hint={pluralize(summary.streaks.current, "day", "days")}
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Time practiced"
            value={formatDurationHuman(summary.totalTimeSeconds)}
            hint={`${attempts.length} ${pluralize(attempts.length, "attempt")}`}
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Accuracy"
            value={summary.accuracyPct === null ? "—" : `${summary.accuracyPct}%`}
            hint="solved / attempted"
          />
        </StatCell>
      </StatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Solved — last 14 days</CardTitle>
            <span className="text-[12px] text-fg-muted tnum">
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          {recent.length === 0 ? (
            <CardBody>
              <p className="text-[14px] text-fg-muted">No attempts yet.</p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-hairline">
              {recent.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <StatusIndicator
                    status={a.status === "solved" ? "solved" : "attempted"}
                  />
                  <Link
                    href={`/app/questions/${a.question?.id}`}
                    className="min-w-0 flex-1 truncate text-[14px] hover:underline"
                  >
                    {a.question?.title ?? "Question"}
                  </Link>
                  <span className="tnum text-[12px] text-fg-muted">
                    {formatClock(a.time_spent_seconds)}
                  </span>
                  <span className="w-14 shrink-0 text-right text-[12px] text-fg-faint">
                    {timeAgo(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.06em] text-fg-muted">
          Your subjects
        </h2>
        {activeSubjects.length === 0 ? (
          <EmptyState
            title="No active subjects yet"
            description="Subjects are released one at a time. Check back soon."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeSubjects.map(({ subject, total, solved }) => {
              const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
              return (
                <Link
                  key={subject.id}
                  href={`/app/subjects/${subject.slug}`}
                  className="group block rounded-md border border-hairline p-5 transition-colors hover:bg-surface"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium">
                        {subject.name}
                      </div>
                      <div className="mt-0.5 text-[13px] text-fg-muted">
                        {solved} of {total} solved
                      </div>
                    </div>
                    <IconChevron
                      size={18}
                      className="mt-0.5 shrink-0 text-fg-faint transition-colors group-hover:text-fg"
                    />
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-hairline">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {!hasActivity && (
        <div className="mt-8">
          <EmptyState
            title="Start practicing"
            description="Open the active subject, pick a question, and the timer starts the moment it loads."
            action={
              <Link
                href="/app/subjects"
                className={buttonVariants({ variant: "primary", size: "md" })}
              >
                Browse subjects
              </Link>
            }
          />
        </div>
      )}
    </>
  );
}
