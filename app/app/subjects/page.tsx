import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllQuestionsMinimal,
  getCurrentUser,
  getSubjects,
  getUserAttempts,
} from "@/lib/queries";
import { statusByQuestion } from "@/lib/metrics";
import { PageHeader } from "@/components/shell/page-header";
import { Tag } from "@/components/ui/tag";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChevron } from "@/components/icons";
import type { QuestionStatus } from "@/components/ui/status";

export const metadata: Metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  const [subjects, questions] = await Promise.all([
    getSubjects(),
    getAllQuestionsMinimal(),
  ]);

  let status = new Map<string, QuestionStatus>();
  if (user) {
    const attempts = await getUserAttempts(user.id);
    status = statusByQuestion(attempts);
  }

  const countsFor = (subjectId: string) => {
    const subjectQuestions = questions.filter((q) => q.subject_id === subjectId);
    const solved = subjectQuestions.filter(
      (q) => status.get(q.id) === "solved",
    ).length;
    return { total: subjectQuestions.length, solved };
  };

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Curated practice for the IIT Madras BS Degree OPPE. Subjects are released one at a time."
      />

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Content is on its way. Check back shortly."
        />
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => {
            const { total, solved } = countsFor(s.id);

            if (!s.is_active) {
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-hairline bg-canvas p-5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px] font-medium text-fg-muted">
                        {s.name}
                      </span>
                      <Tag>Coming soon</Tag>
                    </div>
                    {s.description && (
                      <p className="mt-1 max-w-[62ch] text-[13px] text-fg-faint">
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={s.id}
                href={`/app/subjects/${s.slug}`}
                className="group flex items-center justify-between gap-4 rounded-md border border-hairline bg-canvas p-5 transition-colors hover:bg-surface"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-medium">{s.name}</span>
                    <Tag>{s.short_code}</Tag>
                  </div>
                  {s.description && (
                    <p className="mt-1 max-w-[62ch] text-[13px] text-fg-muted">
                      {s.description}
                    </p>
                  )}
                  <div className="mt-3 text-[12px] tnum text-fg-muted">
                    {total} {total === 1 ? "question" : "questions"}
                    {user && ` · ${solved} solved`}
                  </div>
                </div>
                <IconChevron
                  size={18}
                  className="shrink-0 text-fg-faint transition-colors group-hover:text-fg"
                />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
