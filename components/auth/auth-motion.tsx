"use client";

import { useEffect, useState } from "react";
import { SubjectLogo } from "@/components/subject-logo";

/*
 * A looping product "launch video" on a solid deep-violet stage. Each scene
 * zooms in from the right, holds, then floats left and out. Headlines type on
 * a caret; supporting graphics (icon tiles, an exam timer, a bar graph + ring,
 * a podium) animate in with staggered motion.
 *   0 · Cold open   1 · Scale + subjects   2 · PYQs & real exams
 *   3 · Progress graph   4 · Leaderboard
 */
const SCENE_MS = 4400;
const VIOLET = "#241847"; // solid deep dark violet stage

function CountUp({ to, dur = 1300 }: { to: number; dur?: number }) {
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
  return <>{v.toLocaleString()}</>;
}

/** Types `text` character by character, leaving a blinking caret. */
function Typer({
  text,
  speed = 46,
  start = 150,
}: {
  text: string;
  speed?: number;
  start?: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let t = 0;
    let i = 0;
    const begin = window.setTimeout(function tick() {
      i += 1;
      setN(i);
      if (i < text.length) t = window.setTimeout(tick, speed);
    }, start);
    return () => {
      window.clearTimeout(begin);
      window.clearTimeout(t);
    };
  }, [text, speed, start]);
  return (
    <>
      {text.slice(0, n)}
      <span className="auth-caret ml-0.5 font-normal text-white/80">|</span>
    </>
  );
}

/** A stroke ring that sweeps to `pct` (0–1) on mount. */
function Ring({
  pct,
  size = 66,
  stroke = 6,
}: {
  pct: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#ffffff"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="demo-ring"
        style={
          {
            "--ring-from": `${c}`,
            "--ring-to": `${c * (1 - pct)}`,
          } as React.CSSProperties
        }
      />
    </svg>
  );
}

const SCENES = [SceneScale, SceneExam, SceneProgress, SceneBoard];

export function AuthMotion() {
  const [scene, setScene] = useState(0);
  const n = SCENES.length;

  useEffect(() => {
    const id = window.setInterval(() => setScene((p) => (p + 1) % n), SCENE_MS);
    return () => window.clearInterval(id);
  }, [n]);

  const Active = SCENES[scene];

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden rounded-[22px] p-9 text-white"
      style={{ background: VIOLET }}
    >
      {/* soft depth glows (same violet family) */}
      <span className="auth-orb pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#6d5ce2]/25 blur-3xl" />
      <span className="auth-orb-2 pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[#4a39b8]/25 blur-3xl" />

      {/* scene stage */}
      <div className="relative flex-1">
        <div
          key={scene}
          className="auth-scene absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ ["--scene-ms" as string]: `${SCENE_MS}ms` }}
        >
          <Active />
        </div>
      </div>
    </div>
  );
}

/* ── Scenes ───────────────────────────────────────────────────────────────── */

function SceneScale() {
  const subjects = ["python", "dbms", "java", "c", "syscmd"];
  return (
    <div>
      <div className="flex items-end justify-center gap-2.5">
        <div className="text-[84px] font-bold leading-none tracking-[-0.03em]">
          <CountUp to={1000} />
        </div>
        <div className="pb-3 text-[42px] font-bold text-white/75">+</div>
      </div>
      <div className="mt-2 text-[25px] font-semibold">
        <Typer text="practice questions" />
      </div>
      <div className="demo-rise mt-1 text-[15px] text-white/55" style={{ animationDelay: "0.9s" }}>
        across every OPPE subject
      </div>
      <div className="mt-7 flex justify-center gap-3.5">
        {subjects.map((s, i) => (
          <div
            key={s}
            className="demo-pop grid h-14 w-14 place-items-center rounded-[16px] bg-white shadow-lg shadow-black/20"
            style={{ animationDelay: `${0.8 + i * 0.1}s` }}
          >
            <SubjectLogo slug={s} size={28} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneExam() {
  return (
    <div>
      <div className="text-[32px] font-bold tracking-[-0.02em]">
        <Typer text="PYQs & real exams" />
      </div>
      <div className="demo-rise mt-2 text-[16px] text-white/65" style={{ animationDelay: "1s" }}>
        Past papers and full timed OPPE mocks, under exam conditions.
      </div>

      <div className="mt-7 flex items-center justify-center gap-6">
        {/* countdown timer */}
        <div className="demo-pop relative grid place-items-center" style={{ animationDelay: "0.9s" }}>
          <Ring pct={0.68} size={92} stroke={8} />
          <div className="absolute text-center">
            <div className="font-mono text-[17px] font-bold">01:30</div>
            <div className="text-[9.5px] uppercase tracking-[0.12em] text-white/55">
              left
            </div>
          </div>
        </div>

        {/* question palette */}
        <div>
          <div className="demo-rise mb-2 text-[12px] text-white/55" style={{ animationDelay: "1.1s" }}>
            Question palette
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 15 }).map((_, i) => (
              <span
                key={i}
                className={
                  "demo-pop grid h-7 w-7 place-items-center rounded-[6px] text-[10.5px] font-semibold " +
                  (i < 6
                    ? "bg-white text-[#241847]"
                    : i === 6
                      ? "bg-white/80 text-[#241847]"
                      : "bg-white/12 text-white/60")
                }
                style={{ animationDelay: `${1.1 + i * 0.045}s` }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneProgress() {
  const bars = [
    { label: "Accuracy", v: 82 },
    { label: "Speed", v: 64 },
    { label: "Coverage", v: 73 },
  ];
  return (
    <div>
      <div className="text-[32px] font-bold tracking-[-0.02em]">
        <Typer text="Track your progress" />
      </div>
      <div className="demo-rise mt-2 text-[16px] text-white/65" style={{ animationDelay: "1s" }}>
        Accuracy, speed and coverage — climbing every week.
      </div>

      <div className="mt-7 flex items-end justify-center gap-10">
        {/* bar graph */}
        <div className="flex items-end gap-6">
          {bars.map((b, i) => (
            <div key={b.label} className="flex flex-col items-center">
              <span className="mb-1.5 text-[13px] font-semibold">{b.v}</span>
              <div
                className="demo-grow-y w-11 rounded-t-[6px]"
                style={{
                  height: `${Math.round(b.v * 1.35)}px`,
                  animationDelay: `${0.9 + i * 0.13}s`,
                  background: "linear-gradient(to top,#ffffff55,#ffffff)",
                }}
              />
              <div className="mt-2 text-[11.5px] text-white/55">{b.label}</div>
            </div>
          ))}
        </div>

        {/* coverage ring */}
        <div className="demo-pop relative grid place-items-center" style={{ animationDelay: "1.1s" }}>
          <Ring pct={0.73} size={96} stroke={9} />
          <div className="absolute text-center">
            <div className="text-[20px] font-bold">
              <CountUp to={73} />%
            </div>
            <div className="text-[9.5px] uppercase tracking-[0.12em] text-white/55">
              solved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneBoard() {
  const podium = [
    { r: 2, h: 96, cls: "bg-white/22" },
    { r: 1, h: 132, win: true },
    { r: 3, h: 74, cls: "bg-white/12" },
  ];
  return (
    <div>
      <div className="text-[32px] font-bold tracking-[-0.02em]">
        <Typer text="Climb the leaderboard" />
      </div>
      <div className="demo-rise mt-2 text-[16px] text-white/65" style={{ animationDelay: "1.1s" }}>
        Race the clock — every question ranks its fastest solvers.
      </div>
      <div className="mt-8 flex items-end justify-center gap-3">
        {podium.map((p, i) => (
          <div key={p.r} className="flex flex-col items-center">
            {p.win && (
              <div className="demo-rise mb-1.5" style={{ animationDelay: "1s" }}>
                <svg width="46" height="31" viewBox="0 0 46 31" aria-hidden>
                  <path d="M6 29 L10 8 L18 19 L23 4 L28 19 L36 8 L40 29 Z" fill="#f5c542" stroke="#d99400" strokeWidth="1.4" strokeLinejoin="round" />
                  <rect x="6" y="27" width="34" height="5" rx="1.5" fill="#f5c542" stroke="#d99400" strokeWidth="1" />
                </svg>
              </div>
            )}
            <div
              className={`demo-grow-y grid w-20 place-items-center rounded-t-[8px] text-[22px] font-bold ${p.cls ?? ""}`}
              style={{
                height: `${p.h}px`,
                animationDelay: `${0.9 + i * 0.12}s`,
                ...(p.win ? { background: "#fff", color: VIOLET } : {}),
              }}
            >
              {p.r}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
