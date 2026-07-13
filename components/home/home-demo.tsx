"use client";

import { useEffect, useRef, useState } from "react";
import { SubjectLogo } from "@/components/subject-logo";
import { RankMedal } from "@/components/progress/rank-medal";

/* ── count-up number — replays on remount (screens are keyed) ─────────────── */
function CountUp({
  to,
  dur = 1100,
  prefix = "",
  suffix = "",
}: {
  to: number;
  dur?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setV(Math.round(ease(p) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return (
    <>
      {prefix}
      {v}
      {suffix}
    </>
  );
}

/* ── High-fidelity mock screens ───────────────────────────────────────────── */

function ExamChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 w-full items-center justify-center rounded-[8px] bg-accent-weak text-[12px] font-medium text-accent">
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
        {exams.map((e, i) => (
          <span
            key={e}
            className="demo-pop block flex-1"
            style={{ animationDelay: `${250 + i * 130}ms` }}
          >
            <ExamChip>{e}</ExamChip>
          </span>
        ))}
      </div>
      <span className="mt-3 flex h-9 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-[12.5px] font-semibold text-white">
        Open subject →
      </span>
    </div>
  );
}

function ScreenSubjects() {
  const cards = [
    {
      slug: "python",
      name: "Programming in Python",
      line: "Data Science & Applications | Foundation | Diploma",
      count: 25,
      exams: ["OPPE 1", "OPPE 2"],
    },
    {
      slug: "dbms",
      name: "Database Management",
      line: "Data Science & Applications | Diploma",
      count: 4,
      exams: ["OPPE 1"],
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      {cards.map((c, idx) => (
        <div
          key={c.slug}
          className="demo-rise"
          style={{ animationDelay: `${idx * 130}ms` }}
        >
          <SubjectCard {...c} />
        </div>
      ))}
    </div>
  );
}

function ScreenAttempt() {
  // A rendered mock of the coding interface (question left, editor right) — no
  // image asset, so nothing can fail to load.
  const codeLines = [
    <><span className="text-[#c792ea]">def</span> <span className="text-[#82aaff]">solve</span>():</>,
    <>{"    "}n <span className="text-[#89ddff]">=</span> <span className="text-[#f78c6c]">int</span>(input())</>,
    <>{"    "}xs <span className="text-[#89ddff]">=</span> <span className="text-[#f78c6c]">list</span>(<span className="text-[#f78c6c]">map</span>(<span className="text-[#f78c6c]">int</span>, input().split()))</>,
    <>{"    "}<span className="text-[#f78c6c]">print</span>(<span className="text-[#f78c6c]">sum</span>(x <span className="text-[#c792ea]">for</span> x <span className="text-[#c792ea]">in</span> xs <span className="text-[#c792ea]">if</span> x <span className="text-[#89ddff]">%</span> <span className="text-[#f78c6c]">2</span>))</>,
    <><span className="text-[#82aaff]">solve</span>()</>,
  ];
  return (
    <div className="flex h-full text-[12.5px]">
      {/* left — question */}
      <div className="flex w-1/2 flex-col border-r border-hairline">
        <div className="flex items-center gap-4 border-b border-hairline px-5 py-2.5 text-[12px]">
          <span className="border-b-2 border-accent pb-2 font-semibold text-accent">
            Question
          </span>
          <span className="text-fg-muted">Test Cases</span>
          <span className="text-fg-muted">Solution</span>
        </div>
        <div className="flex-1 overflow-hidden p-5">
          <h4 className="text-[14px] font-semibold text-fg">Sum of Even Numbers</h4>
          <p className="mt-2 leading-relaxed text-fg-muted">
            Read <span className="font-mono text-fg">n</span> integers and print
            the sum of the even ones.
          </p>
          <div className="mt-3 text-[11.5px] text-fg-muted">Example</div>
          <pre className="mt-1 rounded-[6px] border border-hairline bg-surface p-2.5 font-mono text-[12px] text-fg">
            4 1 4 9 9 2 → 4
          </pre>
        </div>
      </div>

      {/* right — editor */}
      <div className="flex w-1/2 flex-col">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5 text-[11.5px]">
          <span className="uppercase tracking-[0.04em] text-fg-faint">Python 3</span>
          <span className="text-fg-faint">runs in your browser</span>
        </div>
        <div className="flex-1 overflow-hidden bg-[#0f0b1e] p-4 font-mono text-[12px] leading-relaxed">
          {codeLines.map((ln, k) => (
            <div
              key={k}
              className="demo-rise text-white/90"
              style={{ animationDelay: `${0.15 + k * 0.16}s` }}
            >
              <span className="mr-3 select-none text-white/25">{k + 1}</span>
              {ln}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-hairline px-4 py-2.5">
          <span className="flex h-8 items-center rounded-[6px] border border-hairline px-3 text-[12px] font-medium text-fg">
            Run sample tests
          </span>
          <span className="flex h-8 items-center rounded-[6px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-3 text-[12px] font-semibold text-white">
            Submit
          </span>
        </div>
      </div>
    </div>
  );
}

function DemoProgressLine({
  label,
  passed,
  total,
  delay,
}: {
  label: string;
  passed: number;
  total: number;
  delay: string;
}) {
  const pct = total ? (passed / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-medium text-fg">{label}</span>
        <span className="tnum text-fg-muted">
          {passed}/{total} passed
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="demo-grow-x h-full rounded-full bg-ok"
          style={{ width: `${pct}%`, animationDelay: delay }}
        />
      </div>
    </div>
  );
}

function ScreenGrading() {
  const publicTests = [{ stdin: "4 1 4 9 9 2", expected: "4" }];
  return (
    <div className="p-6 text-[12.5px]">
      <div className="mb-3 flex gap-5 border-b border-hairline pb-2">
        <span className="text-fg-muted">Question</span>
        <span className="border-b-2 border-accent pb-2 font-semibold text-accent">
          Test Cases
        </span>
        <span className="text-fg-muted">Solution</span>
      </div>

      {/* pass/fail summary — the real ProgressLine block */}
      <div className="space-y-2.5 rounded-[3px] border border-hairline p-3">
        <DemoProgressLine label="Public tests" passed={1} total={1} delay="0.1s" />
        <DemoProgressLine label="Private tests" passed={4} total={4} delay="0.28s" />
      </div>

      {/* submit verdict */}
      <div
        className="demo-rise mt-3 rounded-[3px] border border-ok/40 bg-ok-weak px-3 py-2.5 text-[13px] font-medium text-ok"
        style={{ animationDelay: "0.5s" }}
      >
        Correct — your result matches the expected output.
      </div>

      {/* public test cases with Input / Expected */}
      <div className="mt-3 space-y-3">
        {publicTests.map((t, i) => (
          <div
            key={i}
            className="demo-rise overflow-hidden rounded-[3px] border border-hairline"
            style={{ animationDelay: `${0.58 + i * 0.12}s` }}
          >
            <div className="border-b border-hairline px-3 py-1.5 text-[12px] font-medium text-fg">
              Test {i + 1}
            </div>
            <div className="grid grid-cols-2 gap-3 p-3">
              <div>
                <div className="mb-1 text-[11px] text-fg-muted">Input</div>
                <pre className="whitespace-pre-wrap rounded border border-hairline bg-surface p-2 font-mono text-[12px] text-fg">
                  {t.stdin}
                </pre>
              </div>
              <div>
                <div className="mb-1 text-[11px] text-fg-muted">Expected</div>
                <pre className="whitespace-pre-wrap rounded border border-hairline bg-surface p-2 font-mono text-[12px] text-fg">
                  {t.expected}
                </pre>
              </div>
            </div>
          </div>
        ))}
        <p className="text-[13px] text-fg-muted">
          + 4 private tests run on Test Run and Submit.
        </p>
      </div>
    </div>
  );
}

function ScreenMock() {
  const answered = 4;
  const total = 12;
  return (
    <div className="text-[12.5px]">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <span className="flex items-center gap-2 font-semibold text-fg">
          <span className="demo-soft-pulse h-2 w-2 rounded-full bg-[#e0510e]" />
          Set 1 · Section 1 · Basics
        </span>
        <span className="demo-soft-pulse rounded-[6px] bg-[#241a4d] px-3 py-1 font-mono text-[12px] font-semibold text-white">
          01:29:42
        </span>
      </div>
      <div className="flex gap-5 p-5">
        <div className="flex-1">
          <h4 className="text-[14px] font-semibold text-fg">Sum of Even Numbers</h4>
          <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">
            Read n integers and print the sum of the even ones.
          </p>
          <div className="mt-3 h-20 overflow-hidden rounded-[6px] border border-hairline bg-[#0f0b1e] p-2.5 font-mono text-[11px] leading-relaxed">
            {[
              <><span className="text-[#c792ea]">n</span> <span className="text-[#89ddff]">=</span> <span className="text-[#f78c6c]">int</span>(input())</>,
              <><span className="text-[#c792ea]">xs</span> <span className="text-[#89ddff]">=</span> [<span className="text-[#f78c6c]">int</span>(x) …]</>,
              <><span className="text-[#f78c6c]">print</span>(<span className="text-[#f78c6c]">sum</span>(x <span className="text-[#89ddff]">for</span> x …))</>,
            ].map((ln, k) => (
              <div
                key={k}
                className="demo-rise text-white/90"
                style={{ animationDelay: `${0.2 + k * 0.18}s` }}
              >
                {ln}
              </div>
            ))}
          </div>
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
          <div className="mb-2 flex items-center justify-between text-[11.5px] font-medium text-fg-muted">
            <span>Questions</span>
            <span className="text-fg">
              <CountUp to={answered} dur={900} />/{total}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={
                  "demo-pop grid h-7 w-7 place-items-center rounded-[5px] text-[10.5px] font-semibold " +
                  (i < 4
                    ? "bg-ok text-white"
                    : i === 4
                      ? "bg-accent text-white"
                      : "border border-hairline-strong text-fg-muted")
                }
                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
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

function ScreenProgress() {
  const bars = [
    { label: "Accuracy", value: 78 },
    { label: "Speed", value: 62 },
    { label: "Coverage", value: 72 },
  ];
  // coverage ring
  const R = 22;
  const C = 2 * Math.PI * R;
  const ringTo = C * (1 - 0.72);
  const spark = "M0,40 L30,30 L60,34 L90,18 L120,24 L150,10 L180,14";
  return (
    <div className="p-6 text-[12.5px]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[14px] font-semibold text-fg">Your progress</span>
        <span className="rounded-full bg-accent-weak px-2.5 py-0.5 text-[11px] font-semibold text-accent">
          Rank #3 · Top 29%
        </span>
      </div>

      {/* stat tiles */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Solved", node: <><CountUp to={21} />/29</> },
          { label: "Day streak", node: <CountUp to={9} suffix="d" /> },
          { label: "Avg time", node: "02:12" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="demo-rise rounded-[9px] border border-hairline bg-white p-3"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="text-[11px] text-fg-muted">{s.label}</div>
            <div className="mt-0.5 text-[17px] font-semibold tracking-[-0.01em] text-fg">
              {s.node}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_150px] gap-4">
        {/* growing skill bars */}
        <div className="flex flex-col rounded-[10px] border border-hairline bg-white p-3">
          <div className="mb-2 text-[11.5px] font-medium text-fg-muted">
            Coding profile
          </div>
          <div className="flex min-h-[120px] flex-1 items-end gap-4">
            {bars.map((b, i) => (
              <div key={b.label} className="flex flex-1 flex-col items-center">
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="demo-grow-y relative w-8 rounded-t-[4px] bg-gradient-to-t from-[#5a48d6] to-[#8b7bf0]"
                    style={{
                      height: `${b.value}%`,
                      animationDelay: `${0.15 + i * 0.12}s`,
                    }}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10.5px] font-semibold text-fg">
                      {b.value}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 text-[10px] text-fg-muted">{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* coverage ring + drawing sparkline */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-[10px] border border-hairline bg-white p-3">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={R} fill="none" stroke="#eceafb" strokeWidth="6" />
              <circle
                cx="28"
                cy="28"
                r={R}
                fill="none"
                stroke="#5a48d6"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                transform="rotate(-90 28 28)"
                className="demo-ring"
                style={
                  {
                    "--ring-from": `${C}`,
                    "--ring-to": `${ringTo}`,
                  } as React.CSSProperties
                }
              />
            </svg>
            <div>
              <div className="text-[16px] font-semibold text-fg">
                <CountUp to={72} suffix="%" />
              </div>
              <div className="text-[10.5px] text-fg-muted">coverage</div>
            </div>
          </div>
          <div className="flex-1 rounded-[10px] border border-hairline bg-white p-3">
            <div className="mb-1 text-[10.5px] text-fg-muted">Time / solved</div>
            <svg viewBox="0 0 180 50" className="h-[42px] w-full" fill="none">
              <path
                d={spark}
                stroke="#5a48d6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="demo-draw"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenLeaderboard() {
  const rows = [
    { name: "Aarav Sharma", t: "00:41", d: "fastest", me: true },
    { name: "Meera Krishnan", t: "00:47", d: "+00:06" },
    { name: "Rohan Verma", t: "00:52", d: "+00:11" },
    { name: "Priya Das", t: "01:03", d: "+00:22" },
    { name: "Kabir Mehta", t: "01:08", d: "+00:27" },
  ];
  return (
    <div className="p-6 text-[12.5px]">
      <div className="mb-1 text-[15px] font-semibold text-fg">
        Count Digits Divisible by Three
      </div>
      <p className="mb-3 text-[12.5px] text-fg-muted">
        Top solvers · fastest correct solutions
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={row.name}
            className={
              "demo-rise flex items-center gap-4 rounded-[4px] border-2 border-[#3d3d3d] px-4 py-3 text-[14px] " +
              (row.me ? "bg-accent-weak" : "bg-white")
            }
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <span className="flex w-9 justify-center">
              {i < 3 ? (
                <RankMedal rank={i + 1} className="h-8 w-auto" />
              ) : (
                <span className="tnum text-fg-muted">{i + 1}</span>
              )}
            </span>
            <span className="flex-1 truncate font-medium text-fg">
              {row.name}
              {row.me && (
                <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  You
                </span>
              )}
            </span>
            <span className="tnum w-16 text-right font-medium text-fg">
              {row.t}
            </span>
            <span className="tnum w-16 text-right text-[12px] text-fg-muted">
              {row.d}
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
    cy: 60,
    screen: () => <ScreenGrading />,
  },
  {
    title: "Take a timed mock",
    desc: "Sit a full test series with a live countdown and question palette.",
    cx: 62,
    cy: 74,
    screen: () => <ScreenMock />,
  },
  {
    title: "Track your progress",
    desc: "Watch your accuracy, streak and coverage climb over time.",
    cx: 34,
    cy: 40,
    screen: () => <ScreenProgress />,
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
    }, 4200);
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

        {/* Browser frame — a slice of the real UI */}
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
            <div key={i} className="demo-in absolute inset-0 overflow-auto">
              {step.screen()}
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
