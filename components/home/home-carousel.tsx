"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ── Bespoke artwork per feature (light shapes on a dark ground) ───────────── */

function ArtUnlimited() {
  return (
    <svg viewBox="0 0 220 160" className="h-auto w-[220px]" aria-hidden>
      {/* stacked problem cards */}
      <rect x="52" y="34" width="118" height="86" rx="12" fill="#fff" fillOpacity="0.25" />
      <rect x="42" y="44" width="118" height="86" rx="12" fill="#fff" fillOpacity="0.5" />
      <rect x="32" y="54" width="118" height="86" rx="12" fill="#fff" />
      <rect x="48" y="72" width="58" height="8" rx="4" fill="#5a48d6" fillOpacity="0.9" />
      <rect x="48" y="90" width="86" height="6" rx="3" fill="#5a48d6" fillOpacity="0.24" />
      <rect x="48" y="104" width="70" height="6" rx="3" fill="#5a48d6" fillOpacity="0.24" />
      <rect x="48" y="118" width="48" height="6" rx="3" fill="#5a48d6" fillOpacity="0.24" />
      {/* infinity badge */}
      <g transform="translate(170,58)">
        <circle r="26" fill="#5a48d6" />
        <circle r="26" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" />
        <circle cx="-7" cy="0" r="6.5" fill="none" stroke="#fff" strokeWidth="3.4" />
        <circle cx="7" cy="0" r="6.5" fill="none" stroke="#fff" strokeWidth="3.4" />
      </g>
    </svg>
  );
}

function ArtTimer() {
  return (
    <svg viewBox="0 0 220 160" className="h-auto w-[190px]" aria-hidden>
      <g transform="translate(110,88)">
        <rect x="-9" y="-78" width="18" height="11" rx="3" fill="#fff" />
        <rect x="-3.5" y="-70" width="7" height="9" fill="#fff" />
        <circle r="54" fill="#fff" />
        <circle r="54" fill="none" stroke="#db2f8f" strokeOpacity="0.2" strokeWidth="9" />
        <circle
          r="54"
          fill="none"
          stroke="#db2f8f"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="248 339"
          transform="rotate(-90)"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
          <line
            key={a}
            x1="0"
            y1="-40"
            x2="0"
            y2="-34"
            stroke="#db2f8f"
            strokeOpacity="0.35"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${a})`}
          />
        ))}
        <line x1="0" y1="4" x2="0" y2="-30" stroke="#db2f8f" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="0" y1="4" x2="20" y2="10" stroke="#db2f8f" strokeWidth="3.5" strokeLinecap="round" />
        <circle r="4.5" fill="#db2f8f" />
      </g>
    </svg>
  );
}

function ArtGrade() {
  const rows = [0, 1, 2];
  return (
    <svg viewBox="0 0 220 160" className="h-auto w-[210px]" aria-hidden>
      <rect x="28" y="28" width="164" height="104" rx="13" fill="#fff" />
      {rows.map((r) => {
        const cy = 54 + r * 26;
        return (
          <g key={r}>
            <circle cx="52" cy={cy} r="9.5" fill="#0e9f6e" />
            <path
              d={`M47 ${cy} l3.4 3.6 l6.2 -6.8`}
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="70" y={cy - 4} width="92" height="8" rx="4" fill="#0e9f6e" fillOpacity="0.22" />
          </g>
        );
      })}
    </svg>
  );
}

function ArtProgress() {
  return (
    <svg viewBox="0 0 220 160" className="h-auto w-[210px]" aria-hidden>
      <rect x="24" y="26" width="172" height="108" rx="13" fill="#fff" />
      {/* rising bars */}
      {[
        { x: 44, h: 26 },
        { x: 72, h: 40 },
        { x: 100, h: 54 },
        { x: 128, h: 46 },
        { x: 156, h: 68 },
      ].map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={116 - b.h}
          width="16"
          height={b.h}
          rx="4"
          fill="#e8820e"
          fillOpacity="0.85"
        />
      ))}
      {/* trend line */}
      <polyline
        points="52,88 80,74 108,60 136,66 164,44"
        fill="none"
        stroke="#e8820e"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        [52, 88],
        [80, 74],
        [108, 60],
        [136, 66],
        [164, 44],
      ].map(([cx, cy]) => (
        <circle key={`${cx}`} cx={cx} cy={cy} r="3.4" fill="#fff" stroke="#e8820e" strokeWidth="2.5" />
      ))}
    </svg>
  );
}

function ArtLeaderboard() {
  const rows = [
    { y: 42, medal: "#f5b301", rank: "1", hi: true, w: 74 },
    { y: 72, medal: "#9aa4b2", rank: "2", hi: false, w: 58 },
    { y: 102, medal: "#cd7f32", rank: "3", hi: false, w: 66 },
  ];
  return (
    <svg viewBox="0 0 220 160" className="h-auto w-[210px]" aria-hidden>
      <rect x="26" y="30" width="168" height="104" rx="13" fill="#fff" />
      {rows.map((r) => (
        <g key={r.rank}>
          {r.hi && (
            <rect x="34" y={r.y - 3} width="152" height="26" rx="7" fill="#3b82f6" fillOpacity="0.12" />
          )}
          <circle cx="52" cy={r.y + 10} r="10" fill={r.medal} />
          <text
            x="52"
            y={r.y + 14}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#fff"
          >
            {r.rank}
          </text>
          <rect x="70" y={r.y + 6} width={r.w} height="8" rx="4" fill="#3b82f6" fillOpacity="0.28" />
          <rect x="156" y={r.y + 6} width="22" height="8" rx="4" fill="#3b82f6" fillOpacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

function ArtPyq() {
  return (
    <svg viewBox="0 0 220 160" className="h-auto w-[200px]" aria-hidden>
      {/* document with a folded corner */}
      <path
        d="M64 26 h60 l26 26 v74 a8 8 0 0 1 -8 8 H64 a8 8 0 0 1 -8 -8 V34 a8 8 0 0 1 8 -8 Z"
        fill="#fff"
      />
      <path d="M124 26 v18 a8 8 0 0 0 8 8 h18 Z" fill="#0d9488" fillOpacity="0.28" />
      <rect x="76" y="66" width="52" height="8" rx="4" fill="#0d9488" fillOpacity="0.9" />
      <rect x="76" y="84" width="70" height="6" rx="3" fill="#0d9488" fillOpacity="0.24" />
      <rect x="76" y="98" width="58" height="6" rx="3" fill="#0d9488" fillOpacity="0.24" />
      <rect x="76" y="112" width="66" height="6" rx="3" fill="#0d9488" fillOpacity="0.24" />
      {/* PYQ tag */}
      <g transform="translate(150,112)">
        <rect x="-4" y="-14" width="52" height="28" rx="8" fill="#0d9488" />
        <text x="22" y="5" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#fff">
          PYQ
        </text>
      </g>
    </svg>
  );
}

/* ── Slides — features & benefits, not tech ──────────────────────────────── */

interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  bg: string;
  dot: string;
  art: React.ReactNode;
}

// Soft light sheen from the top-left, over a deep two-stop colour.
const sheen = (a: string, b: string) =>
  `radial-gradient(120% 130% at 14% 0%, rgba(255,255,255,0.16), rgba(255,255,255,0) 52%), linear-gradient(160deg, ${a}, ${b})`;

const SLIDES: Slide[] = [
  {
    title: "Unlimited practice",
    subtitle: "Solve as many exam-style problems as you like — completely free.",
    cta: "Start practising",
    href: "/app/subjects",
    bg: sheen("#3a2d7a", "#241a4d"),
    dot: "#7b6bf0",
    art: <ArtUnlimited />,
  },
  {
    title: "OPPE PYQ practice",
    subtitle: "Solve real questions from previous OPPE exams.",
    cta: "Practise PYQs",
    href: "/app/subjects",
    bg: sheen("#0b5c56", "#073d39"),
    dot: "#14b8a8",
    art: <ArtPyq />,
  },
  {
    title: "Timed mock tests",
    subtitle: "Sit a full test series with a real exam countdown, end to end.",
    cta: "Take a test",
    href: "/app/subjects",
    bg: sheen("#86224f", "#531133"),
    dot: "#ec4899",
    art: <ArtTimer />,
  },
  {
    title: "Instant grading",
    subtitle: "See exactly which test cases pass the moment you submit.",
    cta: "Try it now",
    href: "/app/subjects",
    bg: sheen("#0f6a4c", "#0a3b2b"),
    dot: "#10b981",
    art: <ArtGrade />,
  },
  {
    title: "Question leaderboards",
    subtitle: "Every question has its own board — race to the top on each one.",
    cta: "See rankings",
    href: "/app/subjects",
    bg: sheen("#123a7a", "#0c264d"),
    dot: "#3b82f6",
    art: <ArtLeaderboard />,
  },
  {
    title: "Track your progress",
    subtitle: "Watch your solved count climb across every subject.",
    cta: "View progress",
    href: "/app/progress",
    bg: sheen("#835512", "#553609"),
    dot: "#f59e0b",
    art: <ArtProgress />,
  },
];

export function HomeCarousel() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const n = SLIDES.length;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!paused.current) setIndex((p) => (p + 1) % n);
    }, 4600);
    return () => window.clearInterval(id);
  }, [n]);

  return (
    <div
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="overflow-hidden rounded-[10px]">
        <div
          className="flex transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((s) => (
            <div
              key={s.title}
              className="relative flex min-h-[240px] w-full shrink-0 items-center"
              style={{ background: s.bg }}
            >
              <div className="flex w-full items-center justify-between gap-6 px-8 py-9 sm:px-14">
                <div className="max-w-[62%]">
                  <h3 className="text-[26px] font-bold leading-[1.08] tracking-[-0.01em] text-white sm:text-[34px]">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-[44ch] text-[14px] leading-relaxed text-white/75 sm:text-[15px]">
                    {s.subtitle}
                  </p>
                  <Link
                    href={s.href}
                    className="mt-5 inline-flex h-10 items-center rounded-[8px] bg-white px-5 text-[13.5px] font-semibold text-fg transition-opacity hover:opacity-90"
                  >
                    {s.cta} →
                  </Link>
                </div>
                <div className="hidden shrink-0 sm:block">{s.art}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-3.5 flex justify-center gap-1.5">
        {SLIDES.map((s, d) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Show slide ${d + 1}`}
            aria-current={d === index}
            onClick={() => setIndex(d)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: d === index ? 22 : 6,
              backgroundColor: d === index ? SLIDES[index].dot : "#d4d4d8",
            }}
          />
        ))}
      </div>
    </div>
  );
}
