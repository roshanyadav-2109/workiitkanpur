"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { cn, formatClock } from "@/lib/utils";
import { submitTestAttempt } from "@/lib/test-actions";
import { Markdown } from "@/components/markdown";
import { RuntimeArea } from "@/components/execution/runtime-area";
import { TestCasesPanel } from "@/components/question/test-results";
import type { TestCase } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconChevron,
  IconDashboard,
  IconLock,
  IconSubjects,
  IconTimer,
} from "@/components/icons";
import { describeSectionRule } from "@/lib/scoring";
import type { RunSummary, RuntimeQuestion } from "@/components/execution/types";

interface RunnerQuestion extends RuntimeQuestion {
  title: string;
  body_md: string;
  solution_md: string | null;
  /** What this question is worth on the paper. */
  marks?: number | null;
}
interface RunnerSection {
  name: string;
  questions: RunnerQuestion[];
  /** How many of this section's questions count. null = all of them. */
  bestOf?: number | null;
  /** The paper's own note for the section, e.g. "Solve any one". */
  note?: string | null;
}
type QState = "none" | "answered" | "review";
type Tab = "question" | "tests" | "solution";

/**
 * The cases a question is checked against. A SQL question with none declared is
 * still checked once, against its own database, so the panel shows one case
 * rather than claiming there are none.
 */
function datasetsOf(q: RunnerQuestion): TestCase[] {
  if (q.tests?.length) return q.tests;
  if (q.kind === "sql") return [{ stdin: "", expected: "", hidden: false }];
  return [];
}

/** The paper's own wording for a section rule, else one derived from best_of. */
function sectionRule(sec: RunnerSection): string | null {
  if (sec.note) return sec.note;
  return describeSectionRule(sec.bestOf ?? null, sec.questions.length);
}

const KIND_LABEL: Record<string, string> = {
  coding: "Python 3",
  sql: "SQL",
  shell: "Shell",
  mcq: "Multiple choice",
};

// Exam rule: you may Final Submit only once this much time has elapsed. After
// it, submission is open at any point — you don't have to wait for the timer.
const MIN_SUBMIT_SECONDS = 90 * 60; // 1 hr 30 min

export function TestRunner({
  slug,
  attemptId,
  setName,
  durationSeconds,
  sections,
  environment,
}: {
  slug: string;
  attemptId: string;
  setName: string;
  durationSeconds: number;
  sections: RunnerSection[];
  environment: "learning" | "exam";
}) {
  const isExam = environment === "exam";
  const [curSec, setCurSec] = useState(0);
  const [curQ, setCurQ] = useState(0);
  const [tab, setTab] = useState<Tab>("question");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statusById, setStatusById] = useState<Record<string, QState>>({});
  const [summaryById, setSummaryById] = useState<Record<string, RunSummary>>({});
  const [submittedById, setSubmittedById] = useState<Record<string, number>>({});
  const [fontSize, setFontSize] = useState(13);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Final submit is a round-trip: the server grades the paper and stores it.
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null,
  );
  // Exam only: the paper opens on an instructions screen; the clock and the
  // tab-switch watch don't begin until the learner presses Start.
  const [started, setStarted] = useState(!isExam);
  const [tabSwitches, setTabSwitches] = useState(0);
  // Bumped each time the learner returns to the tab — remounts the blur/warning
  // overlay so its fade-out animation replays.
  const [blurKey, setBlurKey] = useState(0);
  // Absolute epoch-ms when the exam began — the clock is derived from this so it
  // keeps running across refreshes and navigation.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const examKey = `oppe:exam:${slug}:${setName}`;

  const allQuestions = sections.flatMap((s) => s.questions);
  const question = sections[curSec]?.questions[curQ];

  // Test mode counts a shared timer down (auto-submits at zero); after a first
  // submission the learner may flip to practice mode, where time counts up.
  const submittedRef = useRef(false);

  // Everything the runner knows, kept in a ref so finalize() can read the
  // latest values without being re-created (and re-arming the timer) on every
  // keystroke.
  const stateRef = useRef({
    answers,
    statusById,
    summaryById,
    tabSwitches,
    remaining,
    elapsed,
  });
  useEffect(() => {
    stateRef.current = {
      answers,
      statusById,
      summaryById,
      tabSwitches,
      remaining,
      elapsed,
    };
  }, [answers, statusById, summaryById, tabSwitches, remaining, elapsed]);

  /**
   * End the set: grade and store it on the server, then show the result. Guarded
   * so the timer hitting zero and a manual Final Submit can't both file it.
   */
  const finalizingRef = useRef(false);
  const finalize = useCallback(async () => {
    if (finalizingRef.current || submittedRef.current) return;
    finalizingRef.current = true;
    setSaveError(null);
    setSaving(true);

    const s = stateRef.current;
    const payload = allQuestions.map((q) => ({
      questionId: q.id,
      answer: s.answers[q.id] ?? null,
      // MCQs are graded server-side against the stored key; for coding and SQL
      // the in-browser judge is the only place the tests actually ran.
      isCorrect: q.kind === "mcq" ? null : (s.summaryById[q.id]?.solved ?? false),
      status: s.statusById[q.id] ?? ("none" as const),
      timeSpent: 0,
    }));

    const res = await submitTestAttempt({
      attemptId,
      answers: payload,
      leaveCount: s.tabSwitches,
      timeSeconds: isExam ? durationSeconds - s.remaining : s.elapsed,
    });
    setSaving(false);

    if (!res.ok) {
      // Keep the learner on the paper — their work is still in the editor and
      // in localStorage, so they can retry rather than lose the attempt.
      finalizingRef.current = false;
      setSaveError(res.error);
      return;
    }

    submittedRef.current = true;
    setResult({ score: res.score, total: res.total });
    setSubmitted(true);
    setConfirming(false);
    try {
      localStorage.removeItem(examKey);
    } catch {
      /* ignore */
    }
  }, [allQuestions, attemptId, isExam, durationSeconds, examKey]);
  useEffect(() => {
    if (submitted || !started) return;
    const id = window.setInterval(() => {
      // Learning: untimed, counts up. Exam: derive the remaining time from the
      // absolute start so it stays correct across refreshes / inactive tabs.
      if (!isExam) {
        setElapsed((e) => e + 1);
        return;
      }
      if (startedAt == null) return;
      const rem = Math.max(
        0,
        durationSeconds - Math.floor((Date.now() - startedAt) / 1000),
      );
      setRemaining(rem);
      if (rem <= 0) {
        window.clearInterval(id);
        void finalize(); // auto-submit the moment the set time ends
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [submitted, started, isExam, startedAt, durationSeconds, finalize]);

  // Restore an in-progress exam after a refresh or navigating away and back:
  // the clock keeps ticking from the stored start time; switches/answers return.
  // Submission is deliberately NOT restored from here — the server owns whether
  // an attempt is closed, and this cache is cleared once it accepts the paper.
  useEffect(() => {
    if (!isExam) return;
    try {
      const raw = localStorage.getItem(examKey);
      if (!raw) return;
      const s = JSON.parse(raw) as {
        startedAt?: number;
        tabSwitches?: number;
        answers?: Record<string, string>;
        statusById?: Record<string, QState>;
        submittedById?: Record<string, number>;
      };
      if (typeof s.startedAt === "number") {
        setStartedAt(s.startedAt);
        setStarted(true);
        setRemaining(
          Math.max(
            0,
            durationSeconds - Math.floor((Date.now() - s.startedAt) / 1000),
          ),
        );
      }
      if (typeof s.tabSwitches === "number") setTabSwitches(s.tabSwitches);
      if (s.answers) setAnswers(s.answers);
      if (s.statusById) setStatusById(s.statusById);
      if (s.submittedById) setSubmittedById(s.submittedById);
    } catch {
      /* ignore corrupt state */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist exam progress on every meaningful change so it can be resumed.
  useEffect(() => {
    if (!isExam || startedAt == null) return;
    try {
      localStorage.setItem(
        examKey,
        JSON.stringify({
          startedAt,
          tabSwitches,
          answers,
          statusById,
          submittedById,
        }),
      );
    } catch {
      /* ignore quota errors */
    }
  }, [
    isExam,
    examKey,
    startedAt,
    tabSwitches,
    answers,
    statusById,
    submittedById,
  ]);

  // Proctoring: while the exam is live, any time the learner leaves the exam —
  // switching tab, switching window/app, or minimising — is counted once and
  // surfaced on screen. Returning triggers the blur + warning.
  useEffect(() => {
    if (!isExam || !started || submitted) return;
    let away = false;
    const leave = () => {
      if (!away) {
        away = true;
        setTabSwitches((n) => n + 1);
      }
    };
    const back = () => {
      if (away) {
        away = false;
        setBlurKey((k) => k + 1);
      }
    };
    const onVis = () =>
      document.visibilityState === "hidden" ? leave() : back();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", leave);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", back);
    };
  }, [isExam, started, submitted]);

  function startExam() {
    setStartedAt(Date.now());
    setRemaining(durationSeconds);
    setStarted(true);
  }

  function setStatus(qid: string, s: QState) {
    setStatusById((m) => ({ ...m, [qid]: s }));
  }
  function toggleSection(i: number) {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }
  function goto(sec: number, q: number) {
    setResourcesOpen(false);
    setTab("question");
    setCurSec(sec);
    setCurQ(q);
  }
  function goNext() {
    const sec = sections[curSec];
    if (curQ < sec.questions.length - 1) goto(curSec, curQ + 1);
    else if (curSec < sections.length - 1) goto(curSec + 1, 0);
  }
  function markReview() {
    if (question) setStatus(question.id, "review");
  }
  function prev() {
    if (curQ > 0) goto(curSec, curQ - 1);
    else if (curSec > 0)
      goto(curSec - 1, sections[curSec - 1].questions.length - 1);
  }

  function onOutcomes(qid: string, summary: RunSummary | null) {
    if (!summary) return;
    setSummaryById((m) => ({ ...m, [qid]: summary }));
    setTab("tests");
  }
  function onSubmitQuestion(qid: string) {
    // Multiple submissions are allowed; the most recent time wins.
    setSubmittedById((m) => ({ ...m, [qid]: nowSeconds() }));
    setStatus(qid, "answered");
  }

  const answeredCount = allQuestions.filter(
    (q) => statusById[q.id] === "answered",
  ).length;
  const reviewCount = allQuestions.filter(
    (q) => statusById[q.id] === "review",
  ).length;
  const low = isExam && remaining <= 60;
  // Final Submit ends the whole set. In an exam it unlocks once 1 hr 30 min has
  // elapsed (or the timer runs out); in the learning environment it's always on.
  const finalEnabled =
    !isExam ||
    remaining <= 0 ||
    durationSeconds - remaining >= MIN_SUBMIT_SECONDS;

  // Exam gate — full-screen instructions before the paper opens (no rail/nav).
  if (isExam && !started && !submitted) {
    return (
      <ExamInstructions
        setName={setName}
        durationSeconds={durationSeconds}
        sectionCount={sections.length}
        questionCount={allQuestions.length}
        onStart={startExam}
      />
    );
  }

  if (submitted) {
    const notAttempted = allQuestions.length - answeredCount - reviewCount;
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="w-full max-w-md rounded-[3px] border border-hairline p-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-ok-weak text-ok">
            ✓
          </div>
          <h1 className="text-[19px] font-semibold">Set submitted</h1>
          <p className="mt-1 text-[13.5px] text-fg-muted">
            {setName} · time used{" "}
            {formatClock(isExam ? durationSeconds - remaining : elapsed)}
          </p>
          {result && (
            <div className="mt-5 rounded-[3px] border border-hairline bg-surface px-4 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-muted">
                Your score
              </div>
              <div className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.02em] text-fg">
                {result.score}
                <span className="text-[18px] text-fg-muted">
                  {" "}
                  / {result.total}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] text-fg-muted">
                Saved to your mock history.
              </p>
            </div>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat n={answeredCount} label="Submitted" tone="ok" />
            <Stat n={reviewCount} label="For review" tone="review" />
            <Stat n={notAttempted} label="Not attempted" tone="muted" />
          </div>
          <Link
            href={`/app/subjects/${slug}`}
            className="mt-6 inline-flex h-10 items-center rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-6 text-[13px] font-medium text-white ring-1 ring-inset ring-white/20"
          >
            Back to Test Series
          </Link>
        </div>
      </div>
    );
  }

  const qid = question?.id ?? "";
  const curStatus = statusById[qid] ?? "none";
  const submittedAt = submittedById[qid];
  // In the learning environment solutions are open; in the exam they unlock only
  // after you Submit that question.
  const solutionUnlocked = !isExam || !!submittedAt;
  const tabs: { id: Tab; label: string }[] = [
    { id: "question", label: "Question" },
    { id: "tests", label: "Test Cases" },
    { id: "solution", label: "Solution" },
  ];

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Icon rail — exit */}
      <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-hairline py-3">
        <Link
          href={`/app/subjects/${slug}`}
          title="Exit test"
          aria-label="Exit test"
          className="grid h-9 w-9 place-items-center rounded-[3px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
        >
          <IconDashboard size={20} />
        </Link>
      </nav>

      {/* Left nav — the set's sections and questions */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-hairline">
        <div className="flex h-12 items-center border-b border-hairline px-4">
          <span className="truncate text-[14px] font-medium">{setName}</span>
        </div>
        <div className="flex-1 overflow-auto">
          <button
            onClick={() => setResourcesOpen(true)}
            className={cn(
              "flex w-full items-center gap-2.5 border-b border-hairline px-4 py-2.5 text-[13px] font-semibold transition-colors",
              resourcesOpen
                ? "bg-accent-weak text-accent"
                : "text-fg-muted hover:bg-surface hover:text-fg",
            )}
          >
            <IconSubjects size={16} />
            Resources
          </button>
          {sections.map((sec, si) => {
            const open = !collapsed.has(si);
            return (
              <div key={si} className="border-b border-hairline">
                <button
                  onClick={() => toggleSection(si)}
                  className="flex w-full items-start justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-fg">
                      Section {si + 1} · {sec.name}
                    </span>
                    {/* The marking rule is part of the question paper: a student
                        who doesn't know only one of two counts wastes time. */}
                    {sectionRule(sec) && (
                      <span className="mt-0.5 block text-[11.5px] font-medium text-accent">
                        {sectionRule(sec)}
                      </span>
                    )}
                  </span>
                  <IconChevron
                    size={14}
                    className={cn(
                      "mt-0.5 shrink-0 text-fg-muted transition-transform duration-200",
                      open ? "rotate-90" : "",
                    )}
                  />
                </button>
                {open && (
                  <ul className="pb-1">
                    {sec.questions.map((q, i) => {
                      const active =
                        si === curSec && i === curQ && !resourcesOpen;
                      const st = statusById[q.id] ?? "none";
                      return (
                        <li key={q.id}>
                          <button
                            onClick={() => goto(si, i)}
                            className={cn(
                              "relative flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] text-fg transition-colors",
                              active
                                ? "bg-accent-weak font-medium"
                                : "hover:bg-surface",
                            )}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                            )}
                            <span
                              className={cn(
                                "h-2.5 w-2.5 shrink-0 rounded-full",
                                st === "answered"
                                  ? "bg-ok"
                                  : st === "review"
                                    ? "bg-[#d08700]"
                                    : "bg-hairline-strong",
                              )}
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {q.title}
                            </span>
                            {q.marks != null && (
                              <span className="shrink-0 text-[11.5px] tabular-nums text-fg-muted">
                                {q.marks}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 border-t border-hairline p-3 text-[11px] text-fg-muted">
          <Legend cls="bg-ok" text="Submitted" />
          <Legend cls="bg-[#d08700]" text="For review" />
          <Legend cls="bg-hairline-strong" text="Not attempted" />
        </div>
      </aside>

      {resourcesOpen ? (
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-hairline px-4">
            <span className="text-[13px] font-medium">Resources</span>
            <button
              onClick={() => setResourcesOpen(false)}
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Back to question
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <EmptyState
              title="Resources"
              description="Notes, cheat-sheets, formula lists, and reference links live here — available in practice and during every test."
            />
          </div>
        </section>
      ) : (
        <>
          {/* Middle — question / test cases / solution, with set timer + submit */}
          <section className="flex min-w-0 flex-1 flex-col border-r border-hairline">
            <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-2.5">
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-medium leading-tight">
                  {question?.title}
                </h1>
                {submittedAt != null && (
                  <div className="text-[12px] text-ok">
                    Last submitted {timeOfDay(submittedAt)}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isExam && (
                  <span
                    title="Times you left this tab during the exam. Keep this at 0 — every switch is recorded."
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#3d3d3d] px-2.5 py-1 text-[13px] text-fg"
                  >
                    Tab switches
                    <span
                      className={cn(
                        "tnum font-semibold",
                        tabSwitches > 0 ? "text-err" : "text-fg",
                      )}
                    >
                      {tabSwitches}
                    </span>
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-[13px] tnum",
                    !isExam
                      ? "border-hairline text-fg-muted"
                      : low
                        ? "border-err/50 bg-err-weak text-err"
                        : "border-accent-border bg-accent-weak text-accent",
                  )}
                  title={
                    isExam
                      ? "Time left for the whole set"
                      : "Learning — time counts up, no limit"
                  }
                >
                  <IconTimer size={15} />
                  {isExam ? formatClock(remaining) : formatClock(elapsed)}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-hairline px-3">
              {tabs.map((t) => {
                const locked = t.id === "solution" && !solutionUnlocked;
                return (
                  <button
                    key={t.id}
                    onClick={() => !locked && setTab(t.id)}
                    disabled={locked}
                    title={
                      locked ? "Unlocks after you Submit this question" : undefined
                    }
                    className={cn(
                      "-mb-px inline-flex h-10 items-center gap-1.5 border-b-2 px-3 text-[13px] transition-colors",
                      locked
                        ? "cursor-not-allowed border-transparent bg-surface text-fg-faint"
                        : tab === t.id
                          ? "border-accent font-medium text-fg"
                          : "border-transparent text-fg-muted hover:text-fg",
                    )}
                  >
                    {t.label}
                    {locked && <IconLock size={13} />}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-auto p-5">
              {tab === "question" && question && (
                <Markdown>{question.body_md}</Markdown>
              )}
              {/* Every question reports the same way — a SQL question's cases
                  are datasets, a program's are inputs — so they share one
                  panel and one pair of meters. */}
              {tab === "tests" && question && (
                <TestCasesPanel
                  tests={datasetsOf(question)}
                  summary={summaryById[qid] ?? null}
                />
              )}
              {tab === "solution" &&
                question &&
                (solutionUnlocked ? (
                  question.solution_md ? (
                    <Markdown>{question.solution_md}</Markdown>
                  ) : (
                    <p className="text-[13px] text-fg-muted">
                      A written solution for this question is coming soon.
                    </p>
                  )
                ) : (
                  <div className="rounded-[3px] border border-hairline bg-surface px-5 py-10 text-center">
                    <IconLock size={22} className="mx-auto text-fg-muted" />
                    <p className="mt-2 text-[14px] font-medium">
                      Solution locked
                    </p>
                    <p className="mt-1 text-[13px] text-fg-muted">
                      Submit this question to unlock its solution.
                    </p>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-hairline px-4 py-2.5">
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  className="inline-flex h-8 items-center rounded-[3px] bg-[#ececeb] px-4 text-[13px] font-medium text-fg transition-colors hover:bg-[#e2e2e0]"
                >
                  ← Previous
                </button>
                <button
                  onClick={markReview}
                  className={cn(
                    "inline-flex h-8 items-center rounded-[3px] px-4 text-[13px] font-medium transition-colors",
                    curStatus === "review"
                      ? "bg-[#fdf1e3] text-[#b45309]"
                      : "bg-[#ececeb] text-fg hover:bg-[#e2e2e0]",
                  )}
                >
                  Mark for review
                </button>
              </div>
              <button
                onClick={goNext}
                className="inline-flex h-8 items-center rounded-[3px] bg-[#ececeb] px-5 text-[13px] font-medium text-fg transition-colors hover:bg-[#e2e2e0]"
              >
                Next →
              </button>
            </div>
          </section>

          {/* Right — full-height editor, Test Run + Submit */}
          <section
            className="flex min-w-0 flex-1 flex-col"
            style={{ ["--code-font" as string]: `${fontSize}px` } as CSSProperties}
          >
            <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-hairline px-3">
              <span className="text-[13px] font-medium">
                {question ? KIND_LABEL[question.kind] ?? question.kind : ""}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-[3px] border border-hairline">
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
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    submittedAt != null
                      ? "text-ok"
                      : curStatus === "review"
                        ? "text-[#b45309]"
                        : "text-fg-muted",
                  )}
                >
                  {submittedAt != null ? "Submitted" : "Not submitted"}
                </span>
                <button
                  onClick={() => setConfirming(true)}
                  disabled={!finalEnabled}
                  title={
                    finalEnabled
                      ? "End the whole set"
                      : "Final Submit opens after 1 hr 30 min into the exam"
                  }
                  className={cn(
                    "inline-flex h-8 items-center rounded-[3px] px-4 text-[13px] font-medium transition-colors",
                    finalEnabled
                      ? "bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-white ring-1 ring-inset ring-white/20 hover:from-[#7a6ae8] hover:to-[#6455dd]"
                      : "cursor-not-allowed bg-[#ececeb] text-fg-faint",
                  )}
                >
                  Final Submit
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 p-3">
              {question && (
                <RuntimeArea
                  key={question.id}
                  question={question}
                  mode="exam"
                  ide
                  exam
                  initialAnswer={answers[question.id]}
                  onAnswerChange={(code) =>
                    setAnswers((a) => ({ ...a, [question.id]: code }))
                  }
                  onOutcomes={(s) => onOutcomes(question.id, s)}
                  onSubmit={() => onSubmitQuestion(question.id)}
                  bare
                />
              )}
            </div>
          </section>
        </>
      )}

      {/* Tab-switch guard — blur the screen on return, warn, then clear slowly */}
      {isExam && !submitted && blurKey > 0 && (
        <div
          key={blurKey}
          className="exam-blur pointer-events-none fixed inset-0 z-[55] grid place-items-center"
        >
          <div className="absolute inset-0 bg-white/30 backdrop-blur-lg" />
          <div className="relative rounded-[8px] border-2 border-err/60 bg-canvas px-7 py-5 text-center">
            <div className="text-[15.5px] font-semibold text-err">
              Tab switch detected
            </div>
            <p className="mt-1 text-[13px] text-fg-muted">
              Leaving the exam tab is recorded. Total switches so far:{" "}
              <span className="font-semibold text-fg">{tabSwitches}</span>.
            </p>
          </div>
        </div>
      )}

      {/* End-set confirmation */}
      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--overlay)] p-6">
          <div className="w-full max-w-sm rounded-[3px] border border-hairline-strong bg-canvas p-5 shadow-2xl">
            <h2 className="text-[16px] font-semibold">Final submit the set?</h2>
            <p className="mt-1.5 text-[13.5px] text-fg-muted">
              {answeredCount} submitted, {reviewCount} for review,{" "}
              {allQuestions.length - answeredCount - reviewCount} not attempted.
              Your latest submission for each question is the final one.
            </p>
            {saveError && (
              <p className="mt-3 rounded-[3px] border border-err/40 bg-err-weak px-3 py-2 text-[12.5px] text-err">
                Couldn&apos;t submit: {saveError}. Your work is safe — try again.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="inline-flex h-9 items-center rounded-[3px] border border-hairline-strong px-4 text-[13px] font-medium transition-colors hover:bg-surface"
              >
                Keep working
              </button>
              <button
                onClick={() => void finalize()}
                disabled={saving}
                className="inline-flex h-9 items-center rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-4 text-[13px] font-medium text-white ring-1 ring-inset ring-white/20 disabled:opacity-60"
              >
                {saving ? "Submitting…" : "Final submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Full-screen instructions shown before an exam-environment paper opens.
function ExamInstructions({
  setName,
  durationSeconds,
  sectionCount,
  questionCount,
  onStart,
}: {
  setName: string;
  durationSeconds: number;
  sectionCount: number;
  questionCount: number;
  onStart: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const items = [
    <>
      This examination contains <b>{sectionCount}</b>{" "}
      {sectionCount === 1 ? "section" : "sections"} and <b>{questionCount}</b>{" "}
      {questionCount === 1 ? "question" : "questions"}, to be completed within a
      total duration of <b>{formatClock(durationSeconds)}</b>.
    </>,
    <>
      The timer begins the moment you click <b>I am ready to begin</b> and runs
      continuously for the entire duration. When it reaches zero, the
      examination is submitted automatically.
    </>,
    <>
      You must remain on this examination tab at all times.{" "}
      <b>
        Opening a new tab, switching windows, or minimising the browser is
        recorded.
      </b>{" "}
      The number of times you leave the tab is displayed on screen throughout
      the examination and may be reviewed.
    </>,
    <>Do not refresh, resize, or close the browser during the examination.</>,
    <>
      Each question may be run and submitted any number of times. Only your most
      recent submission for a question is considered final.
    </>,
    <>
      Use the question palette on the left to move between sections and
      questions. Questions are colour-coded — green (submitted), amber (marked
      for review) and grey (not attempted).
    </>,
    <>Solutions remain locked until you submit the corresponding question.</>,
    <>
      <b>Final Submit</b> becomes available once 1 hour 30 minutes have elapsed;
      use it to end the examination at any time after that.
    </>,
    <>
      Your code runs locally in your browser. Ensure a stable device before you
      begin.
    </>,
  ];

  return (
    <div className="fixed inset-0 z-[60] overflow-auto bg-canvas text-fg">
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {/* Title bar — violet-filled rectangular header, inset from the sides */}
        <div className="rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 py-5 text-white">
          <h1 className="text-[22px] font-semibold tracking-[-0.01em] sm:text-[25px]">
            {setName}
          </h1>
          <p className="mt-1 text-[14px] font-normal text-white/90 sm:text-[15px]">
            {sectionCount} {sectionCount === 1 ? "section" : "sections"} |{" "}
            {questionCount} {questionCount === 1 ? "question" : "questions"} |{" "}
            {formatClock(durationSeconds)} total duration
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-8">
        <h2 className="text-[15.5px] font-bold">General instructions</h2>
        <p className="mt-1 text-[13px] text-fg-muted">
          Please read the following carefully before you begin.
        </p>

        <ol className="mt-4 max-w-[1050px] list-decimal space-y-3 pl-5 text-[13.5px] leading-relaxed marker:font-semibold marker:text-fg">
          {items.map((node, i) => (
            <li key={i} className="pl-1">
              {node}
            </li>
          ))}
        </ol>

        {/* Declaration */}
        <div className="mt-7 max-w-[1050px] border-t border-hairline pt-5">
          <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-relaxed text-fg">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#5a48d6]"
            />
            I have read and understood all the instructions above, and I will not
            use any unfair means during the examination.
          </label>

          <button
            type="button"
            disabled={!agreed}
            onClick={onStart}
            className={cn(
              "mt-5 inline-flex h-10 items-center rounded-[8px] px-6 text-[13.5px] font-semibold transition-colors",
              agreed
                ? "bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-white ring-1 ring-inset ring-white/20 hover:from-[#7a6ae8] hover:to-[#6455dd]"
                : "cursor-not-allowed bg-[#ececeb] text-fg-faint",
            )}
          >
            I am ready to begin →
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

// Seconds-since-start-of-day, so we can format a stable "last submitted" time
// without touching Date at module scope.
function nowSeconds(): number {
  const d = new Date();
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}
function timeOfDay(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m < 10 ? "0" : ""}${m} ${ap}`;
}

function Legend({ cls, text }: { cls: string; text: string }) {
  return (
    <span>
      <i className={cn("mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-[-1px]", cls)} />
      {text}
    </span>
  );
}

function Stat({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: "ok" | "review" | "muted";
}) {
  return (
    <div className="rounded-[3px] border border-hairline p-3">
      <div
        className={cn(
          "text-[20px] font-semibold tabular-nums",
          tone === "ok" && "text-ok",
          tone === "review" && "text-[#b45309]",
          tone === "muted" && "text-fg-muted",
        )}
      >
        {n}
      </div>
      <div className="mt-0.5 text-[11px] text-fg-muted">{label}</div>
    </div>
  );
}
