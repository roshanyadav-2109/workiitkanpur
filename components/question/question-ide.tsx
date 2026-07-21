"use client";

import { useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatClock } from "@/lib/utils";
import { useStopwatch } from "@/lib/use-stopwatch";
import { usePhoneGate } from "@/components/phone/phone-gate";
import { recordAttempt, saveNote, saveSubmission } from "@/lib/actions";
import { logEvent } from "@/lib/activity";
import { Markdown } from "@/components/markdown";
import { RuntimeArea } from "@/components/execution/runtime-area";
import { StatusIndicator, type QuestionStatus } from "@/components/ui/status";
import { Difficulty } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FloatingNotes } from "@/components/question/floating-notes";
import {
  IconChevron,
  IconChevronDouble,
  IconTimer,
  IconNote,
  IconFilePdf,
  IconDashboard,
  IconProgress,
  IconSubjects,
} from "@/components/icons";
import { SqlResultPanel } from "@/components/question/test-results";
import type {
  GradeResult,
  RunOutput,
  RunSummary,
  SqlOutcome,
  RuntimeQuestion,
} from "@/components/execution/types";
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
  input_labels: string[] | null;
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

// Fixed, non-editable language label shown in the editor header.
const LANGUAGE_LABEL: Record<string, string> = {
  python: "Python 3",
  sql: "SQL",
  c: "C",
  java: "Java",
  bash: "Bash",
};

type Tab = "question" | "tests" | "custom" | "solution";

/** A pass/fail line: green fill for passed, red for failed, on a neutral track. */
function ProgressLine({
  label,
  passed,
  total,
  ran,
}: {
  label: string;
  passed: number;
  total: number;
  ran: boolean;
}) {
  const passPct = total ? (passed / total) * 100 : 0;
  const failPct = ran && total ? ((total - passed) / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-medium text-fg">{label}</span>
        <span className="tnum text-fg-muted">
          {ran ? `${passed}/${total} passed` : `${total} tests, run when you submit`}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
        <div className="bg-ok" style={{ width: `${passPct}%` }} />
        <div className="bg-err" style={{ width: `${failPct}%` }} />
      </div>
    </div>
  );
}

/** A little teacher with a knowing, clever smile — shown atop a solution. */
function TeacherMascot() {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* mortarboard */}
      <path d="M32 9 L51 16.5 L32 24 L13 16.5 Z" fill="#5a48d6" />
      <path
        d="M51 16.5 V27"
        stroke="#5a48d6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="51" cy="28.5" r="1.7" fill="#5a48d6" />
      {/* face */}
      <circle
        cx="32"
        cy="39"
        r="14.5"
        fill="#efecfb"
        stroke="#5a48d6"
        strokeWidth="2"
      />
      {/* raised, knowing eyebrow */}
      <path
        d="M21 32 q3 -2.5 6.5 -1"
        stroke="#5a48d6"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* glasses */}
      <circle cx="26" cy="37" r="4.2" fill="#fff" stroke="#5a48d6" strokeWidth="2" />
      <circle cx="38" cy="37" r="4.2" fill="#fff" stroke="#5a48d6" strokeWidth="2" />
      <path d="M30.2 37 h3.6" stroke="#5a48d6" strokeWidth="2" />
      <circle cx="26" cy="37" r="1.3" fill="#5a48d6" />
      <circle cx="38" cy="37" r="1.3" fill="#5a48d6" />
      {/* clever, lopsided smirk */}
      <path
        d="M25.5 45 q6.5 4.5 13 0.5"
        stroke="#5a48d6"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Monospace console box used for run output / errors (monochrome). */
function OutputBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-hairline">
      <div className="border-b border-hairline px-3 py-1.5 text-[12px] font-medium text-fg">
        {title}
      </div>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-3 font-mono text-[12px] text-fg">
        {body}
      </pre>
    </div>
  );
}

export function QuestionIDE({
  subject,
  current,
  groups,
  isAuthed,
  initialStatus,
  initialNote,
  initialBestSeconds,
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
  const gate = usePhoneGate();
  // Keyed by question so the clock survives a reload and each question keeps
  // its own elapsed time.
  const { seconds, running } = useStopwatch(0, true, `oppe:time:${current.id}`);
  const [tab, setTab] = useState<Tab>("question");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [rightView, setRightView] = useState<
    "editor" | "resources" | "progress"
  >("editor");
  const [notesOpen, setNotesOpen] = useState(false);
  // Custom input is a guided form: the example's lines become locked labels and
  // the learner edits only the values. Seeded from the first public test.
  const exampleStdin =
    current.tests.find((t) => !t.hidden)?.stdin ??
    current.tests[0]?.stdin ??
    "";
  const exampleLines = exampleStdin.length ? exampleStdin.split("\n") : [""];
  const [customValues, setCustomValues] = useState<string[]>(exampleLines);
  const [stdin, setStdin] = useState(exampleLines.join("\n"));

  function setCustomAt(i: number, value: string) {
    // Values may not contain newlines — that would shift the line structure.
    const clean = value.replace(/\n/g, "");
    const next = customValues.map((v, idx) => (idx === i ? clean : v));
    setCustomValues(next);
    setStdin(next.join("\n"));
  }
  // Week groups are collapsible; the current question's week starts open.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const openKey = groups.find((g) =>
      g.questions.some((q) => q.id === current.id),
    )?.key;
    return new Set(groups.filter((g) => g.key !== openKey).map((g) => g.key));
  });
  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  const [status, setStatus] = useState<QuestionStatus>(initialStatus);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState(initialNote);
  const [noteSaved, setNoteSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [sqlOutcome, setSqlOutcome] = useState<SqlOutcome | null>(null);
  const [runOutput, setRunOutput] = useState<RunOutput | null>(null);
  const [isPending, startTransition] = useTransition();

  const loginHref = `/login?next=${encodeURIComponent(`/app/questions/${current.id}`)}`;

  // Run (public) / Submit (private) results land in the Test Cases panel.
  // Progress is NOT captured in practice — that belongs to the timed-test flow.
  function handleOutcomes(next: RunSummary | null) {
    setSummary(next);
    if (next) setTab("tests");
  }

  // "Run code" output lands in the Custom Input panel.
  function handleRunOutput(out: RunOutput | null) {
    setRunOutput(out);
    if (out) setTab("custom");
  }

  // SQL run/submit results land in the Test Cases panel (same as Python).
  function handleSqlOutcome(o: SqlOutcome | null) {
    setSqlOutcome(o);
    if (o) setTab("tests");
  }

  function handleGraded(r: GradeResult) {
    // Green when all tests pass, red when a submission fails.
    setStatus(r.correct ? "solved" : "wrong");
    if (!isAuthed) return;
    // The attempt is what progress, best times and the leaderboard read; the
    // event is the finer-grained trail. Both are best-effort — a failure here
    // must not cost the learner their run.
    startTransition(async () => {
      await recordAttempt({
        questionId: current.id,
        status: r.correct ? "solved" : "attempted",
        timeSpentSeconds: seconds,
        isCorrect: r.correct,
      });
      await logEvent({
        event: r.correct ? "solved" : "submit",
        questionId: current.id,
        meta: { passed: r.passed, total: r.total, seconds },
      });
    });
  }

  // Persist the last submitted code (signed-in users only) so it can be shown
  // in the question analysis / comparison view.
  function handleCodeSubmit(code: string) {
    if (!isAuthed) return;
    startTransition(async () => {
      await saveSubmission({
        questionId: current.id,
        code,
        language: current.language,
      });
    });
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

  // Tests carrying their original index, split into public/private.
  const indexedTests = current.tests.map((t, index) => ({ t, index }));
  const publicTests = indexedTests.filter((x) => !x.t.hidden);
  const privateTests = indexedTests.filter((x) => x.t.hidden);
  const resultByIndex = new Map(
    summary?.results.map((r) => [r.index, r]) ?? [],
  );
  const isCoding = current.kind === "coding";
  // Code-editor kinds share the same full-height editor frame (Python, SQL, …);
  // only the editor and how it runs differ.
  const isCodeEditor = current.kind === "coding" || current.kind === "sql";
  const tabs: Tab[] = [
    "question",
    "tests",
    ...(isCoding ? (["custom"] as Tab[]) : []),
    "solution",
  ];
  const tabLabel: Record<Tab, string> = {
    question: "Question",
    tests: "Test Cases",
    custom: "Custom Input",
    solution: "Solution",
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full">
      {/* Icon rail — back to the subject dashboard, and this question's progress */}
      <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-hairline py-3">
        <Link
          href={`/app/subjects/${subject.slug}`}
          title="Back to dashboard"
          aria-label="Back to dashboard"
          className="grid h-9 w-9 place-items-center rounded-[3px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
        >
          <IconDashboard size={24} />
        </Link>
        <button
          onClick={() => setRightView("progress")}
          title="Question progress"
          aria-label="Question progress"
          aria-pressed={rightView === "progress"}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-[3px] transition-colors",
            rightView === "progress"
              ? "bg-accent-weak text-accent"
              : "text-fg-muted hover:bg-surface hover:text-fg",
          )}
        >
          <IconProgress size={20} />
        </button>
      </nav>

      {/* LEFT NAV — questions in this subject */}
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden border-r border-hairline transition-[width] duration-200 lg:block",
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
              <IconChevronDouble size={18} />
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
                <IconChevronDouble size={16} className="rotate-180" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <button
                onClick={() => setRightView("resources")}
                className={cn(
                  "flex w-full items-center gap-2.5 border-b border-hairline px-4 py-2.5 text-[13px] font-semibold transition-colors",
                  rightView === "resources"
                    ? "bg-accent-weak text-fg"
                    : "text-fg-muted hover:bg-surface hover:text-fg",
                )}
              >
                <IconSubjects size={16} />
                Resources
              </button>
              {groups.map((g) => {
                const open = !collapsedGroups.has(g.key);
                return (
                <div key={g.key} className="border-b border-hairline">
                  <button
                    onClick={() => toggleGroup(g.key)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-[13px] font-semibold text-fg transition-colors hover:bg-surface"
                  >
                    <span className="truncate text-left">
                      {g.week != null ? `Week ${g.week} · ` : ""}
                      {g.label}
                    </span>
                    <IconChevron
                      size={14}
                      className={cn(
                        "shrink-0 text-fg-muted transition-transform duration-200",
                        open ? "rotate-90" : "",
                      )}
                    />
                  </button>
                  {open && (
                  <ul className="pb-1">
                    {g.questions.map((q) => {
                      const active = q.id === current.id;
                      return (
                        <li key={q.id}>
                          <Link
                            href={`/app/questions/${q.id}`}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "relative flex items-center gap-2.5 px-3 py-2 text-[13px] text-fg transition-colors",
                              active
                                ? "bg-accent-weak font-medium"
                                : "hover:bg-surface",
                            )}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                            )}
                            <StatusIndicator
                              status={active ? status : q.status}
                              size={15}
                            />
                            <span className="truncate">{q.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        {/* MIDDLE — question / tests / solution / notes (hidden in Resources view) */}
        {rightView === "editor" && (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-hairline lg:border-b-0 lg:border-r">
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
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Difficulty level={current.difficulty} showLabel={false} />
              <span className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[13px] tnum">
                <IconTimer
                  size={15}
                  className={running ? "text-fg" : "text-fg-faint"}
                />
                {formatClock(seconds)}
              </span>
              <button
                type="button"
                onClick={() =>
                  gate.requirePhone(() => {
                    void logEvent({
                      event: "pdf_download",
                      questionId: current.id,
                    });
                    window.location.href = `/api/questions/${current.id}/pdf`;
                  })
                }
                                                aria-label="Download this question with solution as PDF"
                title="Download question with solution (PDF)"
                className="grid h-8 w-8 place-items-center rounded-md bg-err text-white transition-colors hover:bg-[#b91c1c]"
              >
                <IconFilePdf size={16} />
              </button>
              <button
                onClick={() => setNotesOpen((v) => !v)}
                aria-label="Notes"
                aria-pressed={notesOpen}
                title="Notes"
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md border transition-colors",
                  notesOpen
                    ? "border-accent bg-accent-weak text-fg"
                    : "border-hairline text-fg-muted hover:bg-surface hover:text-fg",
                )}
              >
                <IconNote size={16} />
              </button>
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

            {tab === "tests" && current.kind === "sql" && (
              <SqlResultPanel outcome={sqlOutcome} />
            )}

            {tab === "tests" && current.kind !== "sql" && (
              <div className="space-y-4">
                {/* Pass/fail confirmation lines. */}
                {summary && (
                  <div className="space-y-2.5 rounded-md border border-hairline p-3">
                    <ProgressLine
                      label="Public tests"
                      passed={summary.publicPassed}
                      total={summary.publicTotal}
                      ran
                    />
                    <ProgressLine
                      label="Private tests"
                      passed={summary.privatePassed ?? 0}
                      total={summary.privateTotal}
                      ran={summary.privatePassed !== null}
                    />
                  </div>
                )}

                {current.tests.length === 0 ? (
                  <p className="text-[13px] text-fg">
                    No test cases for this question.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {publicTests.map(({ t, index }, i) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-md border border-hairline"
                      >
                        <div className="border-b border-hairline px-3 py-1.5 text-[12px] font-medium text-fg">
                          Test {i + 1}
                        </div>
                        <div className="grid gap-3 p-3 sm:grid-cols-2">
                          <div>
                            <div className="mb-1 text-[11px] text-fg-muted">
                              Input
                            </div>
                            <pre className="whitespace-pre-wrap rounded border border-hairline bg-surface p-2 font-mono text-[12px] text-fg">
                              {t.stdin || "—"}
                            </pre>
                          </div>
                          <div>
                            <div className="mb-1 text-[11px] text-fg-muted">
                              Expected
                            </div>
                            <pre className="whitespace-pre-wrap rounded border border-hairline bg-surface p-2 font-mono text-[12px] text-fg">
                              {t.expected || "—"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                    {privateTests.length > 0 && (
                      <p className="text-[13px] text-fg-muted">
                        + {privateTests.length} private{" "}
                        {privateTests.length === 1 ? "test" : "tests"} run when
                        you Submit.
                      </p>
                    )}
                  </div>
                )}

                {/* One box, below the tests: error, or the obtained output. */}
                {summary &&
                  (() => {
                    const fail = summary.results.find((r) => !r.passed);
                    const shown = fail ?? summary.results[0];
                    if (!shown) return null;
                    const title = fail
                      ? fail.stderr
                        ? "Error"
                        : "Your output (did not match)"
                      : "Your output";
                    const body = fail
                      ? fail.stderr || fail.got || "(no output)"
                      : shown.got || "(no output)";
                    return <OutputBox title={title} body={body} />;
                  })()}
              </div>
            )}

            {tab === "custom" && (
              <div className="space-y-3">
                <div className="mb-1 text-[13px] font-medium text-fg">
                  Custom input
                </div>
                <p className="text-[12px] text-fg-muted">
                  Each row is one line your program reads with{" "}
                  <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                    input()
                  </code>
                  . Edit only the highlighted values (the labels stay fixed), then
                  press <span className="font-medium text-fg">Run code</span>.
                </p>

                <div className="space-y-2">
                  {customValues.map((val, i) => {
                    const label = current.input_labels?.[i];
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        {/* Fixed, non-erasable label — the value's name */}
                        <span className="w-32 shrink-0 select-none truncate text-[12px] text-fg-muted">
                          {label ?? `Value ${i + 1}`}
                        </span>
                        {/* Editable value — green, code font, non-bold */}
                        <input
                          value={val}
                          onChange={(e) => setCustomAt(i, e.target.value)}
                          aria-label={label ?? `Custom input value ${i + 1}`}
                          spellCheck={false}
                          autoCapitalize="off"
                          autoCorrect="off"
                          className="min-w-0 flex-1 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 font-mono text-[13px] font-normal text-ok focus:outline-none focus-visible:border-accent"
                        />
                      </div>
                    );
                  })}
                </div>

                {runOutput &&
                  (() => {
                    const err = runOutput.stderr;
                    const out = runOutput.stdout;
                    const title = runOutput.timedOut
                      ? "Timed out"
                      : err
                        ? "Error"
                        : "Output";
                    const body =
                      err || out || (runOutput.timedOut ? "" : "(no output)");
                    return <OutputBox title={title} body={body} />;
                  })()}
              </div>
            )}

            {tab === "solution" &&
              (!current.solution_md ? (
                <p className="text-[13px] text-fg-muted">
                  A written solution for this question is coming soon.
                </p>
              ) : revealed ? (
                <div>
                  <div className="mb-5 flex items-center gap-3.5 rounded-[3px] border border-accent-border/40 bg-accent-weak p-3.5">
                    <TeacherMascot />
                    <p className="text-[13px] leading-relaxed text-fg">
                      Here&apos;s the clever way to crack it. Read the approach,
                      understand <em>why</em> it works — then close this and write
                      it yourself.
                    </p>
                  </div>
                  <Markdown>{current.solution_md}</Markdown>
                </div>
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
          </div>
        </section>
        )}

        {/* RIGHT — code editor / runtime (spans full width in Resources view) */}
        <section
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          style={{ ["--code-font" as string]: `${fontSize}px` } as CSSProperties}
        >
          {rightView === "resources" ? (
            <>
              <div className="flex h-12 items-center justify-between gap-2 border-b border-hairline px-3">
                <span className="text-[13px] font-medium">
                  Resources · {subject.name}
                </span>
                <button
                  onClick={() => setRightView("editor")}
                  className="text-[13px] text-fg-muted transition-colors hover:text-fg"
                >
                  Back to editor
                </button>
              </div>
              <div className="flex-1 overflow-auto p-5">
                <EmptyState
                  title="Resources for this subject"
                  description="Notes, cheat-sheets, formula lists, and reference links will appear here. Content is being added."
                />
              </div>
            </>
          ) : rightView === "progress" ? (
            <>
              <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-hairline px-3">
                <span className="text-[13px] font-medium">
                  Your progress · this question
                </span>
                <button
                  onClick={() => setRightView("editor")}
                  className="text-[13px] text-fg-muted transition-colors hover:text-fg"
                >
                  Back to editor
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-auto p-5">
                <div className="rounded-[3px] border border-hairline p-4">
                  <div className="text-[12px] text-fg-muted">Status</div>
                  <div className="mt-1.5">
                    <StatusIndicator status={status} showLabel />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[3px] border border-hairline p-4">
                    <div className="text-[12px] text-fg-muted">Best time</div>
                    <div className="mt-1 text-[19px] font-semibold tnum">
                      {initialBestSeconds != null
                        ? formatClock(initialBestSeconds)
                        : "—"}
                    </div>
                  </div>
                  <div className="rounded-[3px] border border-hairline p-4">
                    <div className="text-[12px] text-fg-muted">
                      This session
                    </div>
                    <div className="mt-1 text-[19px] font-semibold tnum">
                      {formatClock(seconds)}
                    </div>
                  </div>
                </div>

                {summary && (
                  <div className="space-y-2.5 rounded-[3px] border border-hairline p-4">
                    <div className="text-[12px] text-fg-muted">
                      Last {summary.action === "submit" ? "submission" : "run"}
                    </div>
                    <ProgressLine
                      label="Public tests"
                      passed={summary.publicPassed}
                      total={summary.publicTotal}
                      ran
                    />
                    <ProgressLine
                      label="Private tests"
                      passed={summary.privatePassed ?? 0}
                      total={summary.privateTotal}
                      ran={summary.privatePassed !== null}
                    />
                  </div>
                )}

                <p className="text-[12px] leading-relaxed text-fg-faint">
                  During a full test, this panel tracks your progress across all
                  questions, not just this one.
                </p>
              </div>
            </>
          ) : (
            <>
          <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-hairline px-3">
            <span className="text-[13px] font-medium">
              {current.language
                ? (LANGUAGE_LABEL[current.language] ?? current.language)
                : (KIND_LABEL[current.kind] ?? current.kind)}
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
              <span
                className={cn(
                  "text-[13px] font-medium",
                  status === "solved" ? "text-ok" : "text-warn",
                )}
              >
                {status === "solved" ? "Solved" : "Unsolved"}
              </span>
            </div>
          </div>
          {/* Whole space is for writing code; Run/Submit sit at the bottom. */}
          <div className="min-h-0 flex-1 p-3">
            <RuntimeArea
              key={current.id}
              question={current}
              mode="practice"
              onGraded={handleGraded}
              stdin={stdin}
              onStdinChange={setStdin}
              ide={isCodeEditor}
              onOutcomes={handleOutcomes}
              onRunOutput={handleRunOutput}
              onSqlOutcome={handleSqlOutcome}
              onCodeSubmit={handleCodeSubmit}
              bare
            />
          </div>
          {error && (
            <div className="border-t border-hairline px-3 py-2 text-[13px] text-fg">
              {error}
            </div>
          )}
            </>
          )}
        </section>
      </div>

      {notesOpen && (
        <FloatingNotes
          title={current.title}
          note={note}
          onNoteChange={setNote}
          onSave={onSaveNote}
          saving={isPending}
          saved={noteSaved}
          rating={rating}
          setRating={setRating}
          isAuthed={isAuthed}
          onClose={() => setNotesOpen(false)}
        />
      )}
    </div>
  );
}
