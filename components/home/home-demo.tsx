"use client";

import { useEffect, useRef, useState } from "react";
import { SubjectLogo } from "@/components/subject-logo";

/* ── High-fidelity mock screens (the real app design, a few rows each) ────── */

function ExamChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] bg-accent-weak text-[12px] font-medium text-accent">
      {children}
    </span>
  );
}

function SubjectCard({
  slug,
  name,
  line,
  count,
  exams,
}: {
  slug: string;
  name: string;
  line: string;
  count: number;
  exams: string[];
}) {
  return (
    <div className="flex flex-col rounded-[12px] border-2 border-[#3d3d3d] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-surface">
          <SubjectLogo slug={slug} size={22} />
        </span>
        <h4 className="text-[14px] font-semibold text-fg">{name}</h4>
      </div>
      <p className="mt-3 text-[13.5px] text-fg">{line}</p>
      <p className="mt-1 text-[12.5px] text-fg-muted">
        <span className="font-semibold text-fg">{count}</span> questions available
      </p>
      <div className="mt-3 text-[12px] text-fg-muted">Exams</div>
      <div className="mt-1.5 flex gap-2">
        {exams.map((e) => (
          <ExamChip key={e}>{e}</ExamChip>
        ))}
      </div>
      <span className="mt-3 flex h-9 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-[12.5px] font-semibold text-white">
        Open subject →
      </span>
    </div>
  );
}

function ScreenSubjects() {
  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <SubjectCard
        slug="python"
        name="Programming in Python"
        line="Data Science & Applications | Foundation | Diploma"
        count={25}
        exams={["OPPE 1", "OPPE 2"]}
      />
      <SubjectCard
        slug="dbms"
        name="Database Management"
        line="Data Science & Applications | Diploma"
        count={4}
        exams={["OPPE 1"]}
      />
    </div>
  );
}

function ScreenAttempt() {
  // Exact snapshot of the real coding interface (captured from the live app).
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/demo-coding.png"
      alt="Coding interface"
      className="block w-full"
    />
  );
}

function ScreenGrading({ active }: { active: boolean }) {
  const rows = [
    { io: "4 1 4 9 9 2 → 4", hidden: false },
    { io: "3 6 9 12 → 4", hidden: false },
    { io: "1 2 4 5 → 0", hidden: true },
    { io: "9 9 9 → 3", hidden: true },
  ];
  return (
    <div className="p-6 text-[12.5px]">
      <div className="mb-3 flex gap-5 border-b border-hairline pb-2">
        <span className="text-fg-muted">Question</span>
        <span className="border-b-2 border-accent pb-2 font-semibold text-accent">
          Test Cases
        </span>
        <span className="text-fg-muted">Solution</span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 flex justify-between text-[11.5px]">
            <span className="text-fg-muted">Public</span>
            <span className="font-semibold text-ok">2 / 2</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full w-full bg-ok" />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[11.5px]">
            <span className="text-fg-muted">Private</span>
            <span className="font-semibold text-ok">2 / 2</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full w-full bg-ok" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-[7px] border border-[#c3e6cf] bg-[#eafaf1] px-3 py-2"
          >
            <span
              className="demo-check grid h-5 w-5 place-items-center rounded-full bg-ok"
              style={{ animationDelay: active ? `${i * 170}ms` : "0ms" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.5 L10 17 L19 7"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="font-mono text-[12px] text-fg">{r.io}</span>
            <span className="ml-auto text-[11px] font-medium text-fg-muted">
              {r.hidden ? "Private" : "Public"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenMock() {
  return (
    <div className="text-[12.5px]">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <span className="font-semibold text-fg">Set 1 · Section 1 · Basics</span>
        <span className="rounded-[6px] bg-[#241a4d] px-3 py-1 font-mono text-[12px] font-semibold text-white">
          01:29:42
        </span>
      </div>
      <div className="flex gap-5 p-5">
        <div className="flex-1">
          <h4 className="text-[14px] font-semibold text-fg">
            Sum of Even Numbers
          </h4>
          <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">
            Read n integers and print the sum of the even ones.
          </p>
          <div className="mt-3 h-20 rounded-[6px] border border-hairline bg-[#fbfbfd]" />
          <div className="mt-3 flex gap-2">
            <span className="flex h-8 items-center rounded-[6px] border border-accent-border bg-white px-3 text-[12px] font-medium text-accent">
              Test Run
            </span>
            <span className="flex h-8 items-center rounded-[6px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-3 text-[12px] font-semibold text-white">
              Submit
            </span>
          </div>
        </div>
        <div className="w-40">
          <div className="mb-2 text-[11.5px] font-medium text-fg-muted">
            Questions
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className={
                  "grid h-7 w-7 place-items-center rounded-[5px] text-[10.5px] font-semibold " +
                  (i < 4
                    ? "bg-ok text-white"
                    : i === 4
                      ? "bg-accent text-white"
                      : "border border-hairline-strong text-fg-muted")
                }
              >
                {i + 1}
              </span>
            ))}
          </div>
          <span className="mt-3 flex h-8 items-center justify-center rounded-[6px] bg-surface text-[11.5px] font-medium text-fg-faint">
            🔒 Final Submit
          </span>
        </div>
      </div>
    </div>
  );
}

function ScreenLeaderboard() {
  const rows = [
    { r: "1", m: "#f5b301", name: "aarav_s", t: "00:41" },
    { r: "2", m: "#9aa4b2", name: "meera.k", t: "00:47" },
    { r: "3", m: "#cd7f32", name: "rohan22", t: "00:52" },
    { r: "4", m: "#9aa4b2", name: "priya_d", t: "01:03" },
    { r: "5", m: "#9aa4b2", name: "kabir.m", t: "01:08" },
  ];
  return (
    <div className="p-6 text-[12.5px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-semibold text-fg">
          Leaderboard · Count Digits Divisible by Three
        </span>
        <span className="rounded-full bg-accent-weak px-2.5 py-0.5 text-[11px] font-semibold text-accent">
          Fastest time
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={row.r}
            className={
              "flex items-center gap-3 rounded-[7px] px-3 py-2.5 " +
              (i === 0
                ? "border border-accent-border bg-[#eef0fd]"
                : "border border-hairline bg-white")
            }
          >
            <span
              className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: row.m }}
            >
              {row.r}
            </span>
            <span className="font-mono text-[12.5px] text-fg">{row.name}</span>
            <span className="ml-auto font-mono text-[12px] font-semibold text-accent">
              {row.t}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Steps ────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    title: "Pick a subject",
    desc: "Choose from Python, DBMS and more — jump straight into practice.",
    cx: 28,
    cy: 78,
    screen: () => <ScreenSubjects />,
  },
  {
    title: "Attempt a question",
    desc: "Read the problem and write your solution in the built-in editor.",
    cx: 84,
    cy: 80,
    screen: () => <ScreenAttempt />,
  },
  {
    title: "Run & get graded",
    desc: "Run against the public and private test cases and see what passes.",
    cx: 40,
    cy: 40,
    screen: (active: boolean) => <ScreenGrading active={active} />,
  },
  {
    title: "Take a timed mock",
    desc: "Sit a full test series with a live countdown and question palette.",
    cx: 80,
    cy: 84,
    screen: () => <ScreenMock />,
  },
  {
    title: "Climb the leaderboard",
    desc: "Race the clock — every question ranks its fastest solvers.",
    cx: 90,
    cy: 24,
    screen: () => <ScreenLeaderboard />,
  },
];

export function HomeDemo() {
  const [i, setI] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!paused.current) setI((p) => (p + 1) % STEPS.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, []);

  const step = STEPS[i];

  return (
    <div
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <h2 className="text-[22px] font-bold tracking-[-0.01em] text-fg">
        See how it works
      </h2>
      <p className="mt-1 text-[14px] text-fg-muted">
        From picking a subject to topping the leaderboard.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Steps */}
        <ol className="flex flex-col gap-2">
          {STEPS.map((s, idx) => {
            const on = idx === i;
            return (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => setI(idx)}
                  className={
                    "flex w-full items-start gap-3 rounded-[10px] border-2 px-4 py-3 text-left transition-colors " +
                    (on
                      ? "border-[#3d3d3d] bg-white"
                      : "border-transparent hover:bg-surface")
                  }
                >
                  <span
                    className={
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold " +
                      (on ? "bg-accent text-white" : "bg-surface text-fg-muted")
                    }
                  >
                    {idx + 1}
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-semibold text-fg">
                      {s.title}
                    </span>
                    <span
                      className={
                        "mt-0.5 block text-[12.5px] leading-snug text-fg-muted " +
                        (on ? "" : "hidden md:block")
                      }
                    >
                      {s.desc}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Browser frame — a captured slice of the real UI */}
        <div className="overflow-hidden rounded-[12px] border-2 border-[#3d3d3d] bg-white">
          <div className="flex items-center gap-2 border-b border-hairline bg-surface px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
            <span className="ml-3 flex h-6 flex-1 items-center rounded-[5px] bg-white px-3 text-[11px] text-fg-faint">
              oppe-practice.app
            </span>
          </div>
          <div className="relative h-[420px] overflow-hidden">
            <div key={i} className="demo-in absolute inset-0">
              {step.screen(true)}
            </div>

            {/* gliding cursor with a click ripple */}
            <div
              className="pointer-events-none absolute z-20 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ left: `${step.cx}%`, top: `${step.cy}%` }}
            >
              <span className="demo-ripple absolute left-0 top-0 h-9 w-9 rounded-full bg-accent/30" />
              <svg
                className="demo-tap relative"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M5 3 L5 19 L9.5 14.5 L12.5 21 L15 20 L12 13.5 L18.5 13.5 Z"
                  fill="#fff"
                  stroke="#241a4d"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
