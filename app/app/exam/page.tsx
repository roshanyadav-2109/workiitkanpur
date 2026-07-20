import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { startExam } from "@/lib/exam-actions";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { ExamStartButton } from "@/components/exam/exam-start-button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDurationHuman } from "@/lib/utils";

export const metadata: Metadata = { title: "Mock exam" };

export default async function ExamStartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/exam");

  const [{ data: subjects }, { data: sessions }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("exam_sessions")
      .select("id, status, score, total, duration_seconds, started_at, subject_id")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const activeSubjects = subjects ?? [];
  const subjectName = new Map(
    activeSubjects.map((s: { id: string; name: string }) => [s.id, s.name]),
  );

  return (
    <>
      <PageHeader
        title="Timed mock exam"
        description="Real exam conditions — one countdown, no solutions, and answers graded only when you submit. Built to feel like the OPPE."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start a new exam</CardTitle>
          </CardHeader>
          <CardBody>
            {activeSubjects.length === 0 ? (
              <p className="text-[14px] text-fg-muted">
                No subjects are open for exams yet — check back soon.
              </p>
            ) : (
              <form action={startExam} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="subjectId"
                    className="block text-[13px] font-medium"
                  >
                    Subject
                  </label>
                  <Select id="subjectId" name="subjectId" defaultValue={activeSubjects[0].id}>
                    {activeSubjects.map((s: { id: string; name: string }) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="count"
                      className="block text-[13px] font-medium"
                    >
                      Questions
                    </label>
                    <Select id="count" name="count" defaultValue="5">
                      <option value="3">3</option>
                      <option value="5">5</option>
                      <option value="8">8</option>
                      <option value="10">10</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="duration"
                      className="block text-[13px] font-medium"
                    >
                      Duration (min)
                    </label>
                    <Select id="duration" name="duration" defaultValue="15">
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                      <option value="45">45</option>
                    </Select>
                  </div>
                </div>

                <ExamStartButton />
              </form>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past exams</CardTitle>
          </CardHeader>
          {sessions && sessions.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {sessions.map(
                (s: {
                  id: string;
                  status: string;
                  score: number | null;
                  total: number | null;
                  duration_seconds: number;
                  started_at: string;
                  subject_id: string;
                }) => (
                  <li key={s.id}>
                    <Link
                      href={`/app/exam/${s.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium">
                          {subjectName.get(s.subject_id) ?? "Exam"}
                        </div>
                        <div className="text-[12px] text-fg-muted">
                          {new Date(s.started_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · {formatDurationHuman(s.duration_seconds)}
                        </div>
                      </div>
                      {s.status === "submitted" ? (
                        <span className="text-[14px] font-medium tnum text-accent">
                          {s.score}/{s.total}
                        </span>
                      ) : (
                        <span className="text-[12px] text-fg-muted">
                          In progress
                        </span>
                      )}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <CardBody>
              <EmptyState
                title="No exams yet"
                description="Start your first timed mock exam to see results here."
              />
            </CardBody>
          )}
        </Card>
      </div>
    </>
  );
}
