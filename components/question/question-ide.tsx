"use client";

import { useRef, useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatClock } from "@/lib/utils";
import { useStopwatch } from "@/lib/use-stopwatch";
import { recordAttempt, saveNote } from "@/lib/actions";
import { Markdown } from "@/components/markdown";
import { RuntimeArea } from "@/components/execution/runtime-area";
import { StatusIndicator, type QuestionStatus } from "@/components/ui/status";
import { Difficulty } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { IconChevron, IconTimer } from "@/components/icons";
import type { GradeResult, RuntimeQuestion } from "@/components/execution/types";
import type { Difficulty as DifficultyLevel } from "@/lib/types";

export interface IDEListQuestion {
  id: string;
  title: string;
  status: QuestionStatus;
}
export interface IDETopicGroup {
  key: string;
  label: string;
  week: number | null;
  questions: IDEListQuestion[];
}
export interface IDECurrentQuestion extends RuntimeQuestion {
  title: string;
  difficulty: DifficultyLevel;
  body_md: string;
  solution_md: string | null;
  topicName: string | null;
  week: number | null;
}

const KIND_LABEL: Record<string, string> = {
  coding: "Python 3",
  sql: "SQL",
  mcq: "Multiple choice",
  shell: "Shell",
  java: "Java",
  c: "C",
};

type Tab = "question" | "tests" | "solution" | "notes";

export function QuestionIDE({
  subject,
  current,
  groups,
  isAuthed,
  initialStatus,
  initialNote,
}: {
  subject: { name: string; slug: string };
  current: IDECurrentQuestion;
  groups: IDETopicGroup[];
  isAuthed: boolean;
  initialStatus: QuestionStatus;
  initialNote: string;
  initialBestSeconds: number | null;
}) {
  const router = useRouter();
  const { seconds, running } = useStopwatch(0, true);
  const [tab, setTab] = useState<Tab>("question");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [status, setStatus] = useState<QuestionStatus>(initialStatus);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState(initialNote);
  const [noteSaved, setNoteSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const autoSolved = useRef(false);

  const loginHref = `/login?next=${encodeURIComponent(`/app/questions/${current.id}`)}`;

  function record(next: "attempted" | "solved", isCorrect: boolean | null) {
    const at = seconds;
    startTransition(async () => {
      const res = await recordAttempt({
        questionId: current.id,
        status: next,
        timeSpentSeconds: at,
        selfRating: rating,
        isCorrect,
      });
      if (res.ok) {
        setStatus(next);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function mark(next: "attempted" | "solved") {
    setError(null);
    if (!isAuthed) return router.push(loginHref);
    if (next === "solved") autoSolved.current = true;
    record(next, next === "solved" ? true : null);
  }

  function handleGraded(r: GradeResult) {
    if (r.correct && !autoSolved.current && status !== "solved") {
      autoSolved.current = true;
      if (isAuthed) record("solved", true);
      else setStatus("solved");
    }
  }

  function onSaveNote() {
    setError(null);
    if (!isAuthed) return router.push(loginHref);
    startTransition(async () => {
      const res = await saveNote({ questionId: current.id, content: note });
      if (res.ok) {
        setNoteSaved(true);
        window.setTimeout(() => setNoteSaved(false), 2000);
      } else {
        setError(res.error);
      }
    });
  }

  const visibleTests = current.tests.filter((t) => !t.hidden);
  const hiddenCount = current.tests.length - visibleTests.length;
  const tabs: Tab[] = [
    "question",
    "tests",
    "solution",
    ...(isAuthed ? (["notes"] as Tab[]) : []),
  ];
  const tabLabel: Record<Tab, string> = {
    question: "Question",
    tests: "Test Cases",
    solution: "Solution",
    notes: "Notes",
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full">
      {/* LEFT NAV — questions in this subject */}
      <aside
        className={cn(
          "shrink-0 overflow-hidden border-r border-hairline transition-[width] duration-200",
          navCollapsed ? "w-12" : "w-72",
        )}
      >
        {navCollapsed ? (
          <div className="flex flex-col items-center py-3">
            <button
              aria-label="Expand list"
              onClick={() => setNavCollapsed(false)}
              className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-surface hover:text-fg"
            >
              <IconChevron size={18} />
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex h-12 items-center justify-between gap-2 border-b border-hairline px-4">
              <span className="truncate text-[14px] font-medium">
                {subject.name}
              </span>
              <button
                aria-label="Collapse list"
                onClick={() => setNavCollapsed(true)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-surface hover:text-fg"
              >
                <IconChevron size={16} className="rotate-180" />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              {groups.map((g) => (
                <div key={g.key} className="mb-1">
                  <div className="px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-muted">
                    {g.week != null ? `Week ${g.week} · ` : ""}
                    {g.label}
                  </div>
                  <ul>
                    {g.questions.map((q) => {
                      const active = q.id === current.id;
                      return (
                        <li key={q.id}>
                          <Link
                            href={`/app/questions/${q.id}`}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "relative flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors",
                              active
                                ? "bg-accent-weak font-medium text-fg"
                                : "text-fg-muted hover:bg-surface hover:text-fg",
                            )}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                            )}
                            <StatusIndicator status={q.status} size={15} />
                            <span className="truncate">{q.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1">
        {/* MIDDLE — question / tests / solution / notes */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-hairline">
          <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-2.5">
            <div className="flex min-w-0 items-start gap-2">
              <Link
                href={`/app/subjects/${subject.slug}`}
                aria-label="Back to subject"
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-surface hover:text-fg"
              >
                <IconChevron size={16} className="rotate-180" />
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-medium leading-tight">
                  {current.title}
                </h1>
                <div className="text-[12px] text-fg-muted">
                  {current.week != null ? `Week ${current.week}` : ""}
                  {current.topicName
                    ? `${current.week != null ? " · " : ""}${current.topicName}`
                    : ""}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Difficulty level={current.difficulty} showLabel={false} />
              <span className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[13px] tnum">
                <IconTimer
                  size={15}
                  className={running ? "text-fg" : "text-fg-faint"}
                />
                {formatClock(seconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-hairline px-3">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px h-10 border-b-2 px-3 text-[13px] transition-colors",
                  tab === t
                    ? "border-accent font-medium text-fg"
                    : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {tabLabel[t]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-5">
            {tab === "question" && <Markdown>{current.body_md}</Markdown>}

            {tab === "tests" &&
              (current.tests.length === 0 ? (
                <p className="text-[13px] text-fg-muted">
                  No test cases for this question.
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleTests.map((t, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-md border border-hairline"
                    >
                      <div className="border-b border-hairline px-3 py-1.5 text-[12px] font-medium text-fg-muted">
                        Test {i + 1}
                      </div>
                      <div className="grid gap-3 p-3 sm:grid-cols-2">
                        <div>
                          <div className="mb-1 text-[11px] uppercase tracking-[0.04em] text-fg-faint">
                            Input
                          </div>
                          <pre className="whitespace-pre-wrap rounded border border-hairline bg-surface p-2 font-mono text-[12px]">
                            {t.stdin || "—"}
                          </pre>
                        </div>
                        <div>
                          <div className="mb-1 text-[11px] uppercase tracking-[0.04em] text-fg-faint">
                            Expected
                          </div>
                          <pre className="whitespace-pre-wrap rounded border border-hairline bg-surface p-2 font-mono text-[12px]">
                            {t.expected || "—"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <p className="text-[13px] text-fg-muted">
                      + {hiddenCount} hidden {hiddenCount === 1 ? "test" : "tests"}{" "}
                      also run when you check your code.
                    </p>
                  )}
                </div>
              ))}

            {tab === "solution" &&
              (!current.solution_md ? (
                <p className="text-[13px] text-fg-muted">
                  No solution available.
                </p>
              ) : revealed ? (
                <Markdown>{current.solution_md}</Markdown>
              ) : (
                <div className="rounded-md border border-hairline px-5 py-8 text-center">
                  <p className="text-[14px] font-medium">Solution hidden</p>
                  <p className="mt-1 text-[13px] text-fg-muted">
                    Give it a genuine try first.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    onClick={() => setRevealed(true)}
                  >
                    Reveal solution
                  </Button>
                </div>
              ))}

            {tab === "notes" && (
              <div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Jot the approach, a gotcha, the edge case you missed…"
                  className="min-h-[160px] text-[13px]"
                  disabled={!isAuthed}
                />
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onSaveNote}
                    disabled={!isAuthed || isPending}
                  >
                    Save note
                  </Button>
                  {noteSaved && (
                    <span className="text-[12px] text-fg-muted">Saved</span>
                  )}
                </div>
                <div className="mt-6">
                  <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
                    How hard did it feel?
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        aria-label={`Rate ${n} of 5`}
                        onClick={() => setRating((r) => (r === n ? null : n))}
                        className={cn(
                          "h-8 w-8 rounded-md border text-[13px] tnum transition-colors",
                          rating !== null && n <= rating
                            ? "border-accent bg-accent text-accent-fg"
                            : "border-hairline-strong text-fg-muted hover:bg-surface",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — code editor / runtime */}
        <section
          className="flex min-w-0 flex-1 flex-col"
          style={{ ["--code-font" as string]: `${fontSize}px` } as CSSProperties}
        >
          <div className="flex h-12 items-center justify-between gap-2 border-b border-hairline px-3">
            <span className="text-[13px] font-medium">
              {KIND_LABEL[current.kind] ?? current.kind}
            </span>
            <div className="flex items-center gap-2">
              {current.kind !== "mcq" && (
                <div className="flex items-center rounded-md border border-hairline">
                  <button
                    aria-label="Smaller font"
                    onClick={() => setFontSize((f) => Math.max(10, f - 1))}
                    className="grid h-7 w-7 place-items-center text-fg-muted hover:bg-surface hover:text-fg"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-[12px] tnum">
                    {fontSize}
                  </span>
                  <button
                    aria-label="Larger font"
                    onClick={() => setFontSize((f) => Math.min(22, f + 1))}
                    className="grid h-7 w-7 place-items-center text-fg-muted hover:bg-surface hover:text-fg"
                  >
                    +
                  </button>
                </div>
              )}
              <StatusIndicator status={status} showLabel />
              {isAuthed ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => mark("attempted")}
                    disabled={isPending}
                  >
                    Attempted
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => mark("solved")}
                    disabled={isPending}
                  >
                    Mark solved
                  </Button>
                </>
              ) : (
                <Link
                  href={loginHref}
                  className="text-[13px] text-accent underline underline-offset-2"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <RuntimeArea
              key={current.id}
              question={current}
              mode="practice"
              onGraded={handleGraded}
              bare
            />
          </div>
          {error && (
            <div className="border-t border-hairline px-3 py-2 text-[13px] text-fg">
              {error}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
