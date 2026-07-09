import Link from "next/link";
import { Stat } from "@/components/ui/stat";
import { StatGrid, StatCell } from "@/components/shell/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status";
import { Difficulty } from "@/components/ui/tag";
import { buttonVariants } from "@/components/ui/button";
import { formatDurationHuman } from "@/lib/utils";

interface AnswerRow {
  question_id: string;
  is_correct: boolean | null;
  answer: string | null;
}
interface QRow {
  id: string;
  title: string;
  kind: string;
  difficulty: "easy" | "medium" | "hard";
}

export function ExamResults({
  session,
  answers,
  questions,
}: {
  session: {
    score: number | null;
    total: number | null;
    duration_seconds: number;
    started_at: string;
    submitted_at: string | null;
    leave_count: number;
    question_ids: string[];
  };
  answers: AnswerRow[];
  questions: QRow[];
}) {
  const score = session.score ?? 0;
  const total = session.total ?? session.question_ids.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const answerByQ = new Map(answers.map((a) => [a.question_id, a]));
  const qById = new Map(questions.map((q) => [q.id, q]));
  const ordered = session.question_ids
    .map((id) => qById.get(id))
    .filter(Boolean) as QRow[];

  const elapsed =
    session.submitted_at != null
      ? Math.max(
          0,
          Math.round(
            (new Date(session.submitted_at).getTime() -
              new Date(session.started_at).getTime()) /
              1000,
          ),
        )
      : session.duration_seconds;

  return (
    <>
      <div className="mb-2">
        <Link
          href="/app/exam"
          className="text-[13px] text-fg-muted transition-colors hover:text-fg"
        >
          Mock exam
        </Link>
      </div>
      <h1 className="mb-8 text-[24px] font-medium tracking-[-0.01em]">
        Exam results
      </h1>

      <StatGrid>
        <StatCell>
          <Stat label="Score" focal value={`${score}/${total}`} hint={`${pct}%`} />
        </StatCell>
        <StatCell>
          <Stat label="Correct" value={score} hint={`of ${total}`} />
        </StatCell>
        <StatCell>
          <Stat
            label="Time used"
            value={formatDurationHuman(elapsed)}
            hint={`of ${formatDurationHuman(session.duration_seconds)}`}
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Left exam"
            value={session.leave_count}
            hint="tab switches"
          />
        </StatCell>
      </StatGrid>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Question breakdown</CardTitle>
        </CardHeader>
        <ul className="divide-y divide-hairline">
          {ordered.map((q, i) => {
            const a = answerByQ.get(q.id);
            const correct = a?.is_correct === true;
            return (
              <li
                key={q.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <StatusIndicator status={correct ? "solved" : "unsolved"} />
                <span className="w-6 shrink-0 text-[13px] tnum text-fg-muted">
                  {i + 1}
                </span>
                <Link
                  href={`/app/questions/${q.id}`}
                  className="min-w-0 flex-1 truncate text-[14px] font-medium hover:underline"
                >
                  {q.title}
                </Link>
                <Difficulty level={q.difficulty} showLabel={false} />
                <span
                  className={cnResult(correct)}
                >
                  {correct ? "Correct" : "Incorrect"}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="mt-6">
        <Link
          href="/app/exam"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          Take another exam
        </Link>
      </div>
    </>
  );
}

function cnResult(correct: boolean): string {
  return correct
    ? "w-20 text-right text-[13px] text-accent"
    : "w-20 text-right text-[13px] text-fg-muted";
}
