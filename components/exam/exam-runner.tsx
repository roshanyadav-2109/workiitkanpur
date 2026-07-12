"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePythonRunner } from "@/lib/python-runner";
import { gradeOutput } from "@/lib/grading";
import { submitExam } from "@/lib/exam-actions";
import { cn, formatClock } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { Difficulty } from "@/components/ui/tag";
import { RuntimeArea } from "@/components/execution/runtime-area";
import type { RuntimeQuestion } from "@/components/execution/types";
import type { Difficulty as DifficultyLevel, QuestionKind } from "@/lib/types";

export interface ExamQuestion extends RuntimeQuestion {
  title: string;
  body_md: string;
  difficulty: DifficultyLevel;
  kind: QuestionKind;
}

const STARTER_COMMENT = "# Read input with input(); print your answer.";

/** An answer counts as given if it is non-empty and not just the starter stub. */
function isAnswered(a: string | undefined): boolean {
  if (a == null) return false;
  const t = a.trim();
  return t !== "" && t !== STARTER_COMMENT;
}

export function ExamRunner({
  sessionId,
  remainingSeconds,
  questions,
}: {
  sessionId: string;
  remainingSeconds: number;
  questions: ExamQuestion[];
}) {
  const router = useRouter();
  const runner = usePythonRunner();
  const [remaining, setRemaining] = useState(remainingSeconds);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaveCount, setLeaveCount] = useState(0);
  const submittedRef = useRef(false);

  const q = questions[current];

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);

    const results = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers[question.id] ?? null;
      let isCorrect: boolean | null = null; // mcq graded server-side
      if (question.kind === "coding") {
        isCorrect = false;
        if (answer && question.tests.length > 0) {
          setProgress(`Grading question ${i + 1} of ${questions.length}…`);
          let allPass = true;
          for (const t of question.tests) {
            const res = await runner.run(answer, t.stdin);
            if (!(res.ok && gradeOutput(t, res.stdout))) {
              allPass = false;
              break;
            }
          }
          isCorrect = allPass;
        }
      }
      results.push({
        questionId: question.id,
        answer,
        isCorrect,
        timeSpent: 0,
      });
    }

    setProgress("Submitting…");
    const res = await submitExam({ sessionId, answers: results, leaveCount });
    if (res.ok) {
      router.replace(`/app/exam/${sessionId}`);
      router.refresh();
    } else {
      submittedRef.current = false;
      setError(res.error);
      setSubmitting(false);
      setProgress(null);
    }
  }, [answers, questions, runner, sessionId, leaveCount, router]);

  // Keep the latest doSubmit in a ref so the once-mounted countdown always
  // submits with the CURRENT answers (not the empty first-render closure).
  const doSubmitRef = useRef(doSubmit);
  useEffect(() => {
    doSubmitRef.current = doSubmit;
  });

  // Pre-warm Pyodide if the exam has any coding question (grading needs it).
  useEffect(() => {
    if (questions.some((qq) => qq.kind === "coding")) runner.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown, with auto-submit at zero.
  useEffect(() => {
    if (remaining <= 0) {
      void doSubmitRef.current();
      return;
    }
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          void doSubmitRef.current();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proctoring: count tab/window switches.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setLeaveCount((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const setAnswer = useCallback(
    (id: string, value: string) => {
      setAnswers((a) => (a[id] === value ? a : { ...a, [id]: value }));
    },
    [],
  );

  const answeredCount = questions.filter((x) => isAnswered(answers[x.id])).length;

  const low = remaining <= 60;

  if (submitting) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-[15px] font-medium">Submitting your exam</p>
        <p className="mt-2 text-[13px] text-fg-muted">
          {progress ?? "Grading…"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Exam bar */}
      <div className="sticky top-14 z-10 -mx-4 mb-6 flex items-center justify-between gap-4 border-b border-hairline bg-canvas/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            aria-label={`Time remaining ${formatClock(remaining)}`}
            className={cn(
              "tnum text-[22px] font-semibold tracking-[-0.02em]",
              low ? "text-accent" : "text-fg",
            )}
          >
            {formatClock(remaining)}
          </span>
          <span className="text-[13px] text-fg-muted">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className="flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-[13px] text-fg-muted">
                Submit and end the exam?
              </span>
              <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={doSubmit}>
                Submit exam
              </Button>
            </>
          ) : (
            <Button size="sm" variant="primary" onClick={() => setConfirming(true)}>
              Submit exam
            </Button>
          )}
        </div>
      </div>

      {leaveCount > 0 && (
        <div className="mb-4 rounded-md border border-hairline-strong bg-surface px-4 py-2 text-[13px] text-fg-muted">
          You left the exam {leaveCount} {leaveCount === 1 ? "time" : "times"}.
          This is recorded.
        </div>
      )}

      {low && (
        <div className="mb-4 rounded-md border border-accent-border bg-accent-weak px-4 py-2 text-[13px]">
          Under a minute remaining — the exam auto-submits at zero.
        </div>
      )}

      {/* Question */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
          Question {current + 1} of {questions.length}
        </span>
        <Difficulty level={q.difficulty} />
      </div>
      <h1 className="text-[20px] font-medium tracking-[-0.01em]">{q.title}</h1>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Markdown>{q.body_md}</Markdown>
          <div className="mt-6">
            <RuntimeArea
              key={q.id}
              question={q}
              mode="exam"
              initialAnswer={answers[q.id]}
              onAnswerChange={(v) => setAnswer(q.id, v)}
            />
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-32">
            <div className="rounded-md border border-hairline p-4">
              <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
                Questions
              </div>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((qq, i) => {
                  const answered = isAnswered(answers[qq.id]);
                  return (
                    <button
                      key={qq.id}
                      onClick={() => setCurrent(i)}
                      aria-current={i === current ? "true" : undefined}
                      aria-label={`Question ${i + 1}${answered ? ", answered" : ", not answered"}${i === current ? ", current" : ""}`}
                      className={cn(
                        "h-8 w-full rounded-md border text-[13px] tnum transition-colors",
                        i === current
                          ? "border-accent bg-accent text-accent-fg"
                          : answered
                            ? "border-accent-border bg-accent-weak text-fg"
                            : "border-hairline-strong text-fg-muted hover:bg-surface",
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  disabled={current === questions.length - 1}
                  onClick={() =>
                    setCurrent((c) => Math.min(questions.length - 1, c + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
            {error && (
              <p className="mt-3 text-[13px] text-fg">{error}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
