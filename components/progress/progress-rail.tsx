"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PROMOS = [
  {
    kicker: "Mock tests",
    title: "Beat the clock.",
    sub: "Timed mocks that feel like the real exam.",
    cta: "Take a test",
    href: "/app/subjects",
    bg: "linear-gradient(160deg,#4a39b8,#221645)",
    glyph: "◷",
  },
  {
    kicker: "Leaderboard",
    title: "Climb the board.",
    sub: "Every question you solve moves you up.",
    cta: "See rankings",
    href: "/leaderboard",
    bg: "linear-gradient(160deg,#0f6a4c,#083b2b)",
    glyph: "▲",
  },
  {
    kicker: "PYQ vault",
    title: "Past papers.",
    sub: "Practise real questions from past OPPEs.",
    cta: "Explore",
    href: "/app/subjects",
    bg: "linear-gradient(160deg,#a11f57,#521133)",
    glyph: "◎",
  },
];

export function ProgressRail({
  toGo,
  nextTarget,
  focusTopic,
  focusPct,
  struggling,
}: {
  toGo: number;
  nextTarget: number;
  focusTopic: string | null;
  focusPct: number;
  struggling: number;
}) {
  const [i, setI] = useState(0);
  const n = PROMOS.length;

  useEffect(() => {
    const id = window.setInterval(() => setI((p) => (p + 1) % n), 4500);
    return () => window.clearInterval(id);
  }, [n]);

  const doneToTarget = nextTarget > 0 ? ((nextTarget - toGo) / nextTarget) * 100 : 100;

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* next milestone */}
      <div className="rounded-[10px] border border-hairline bg-canvas p-3.5">
        <div className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-fg-muted">
          Next milestone
        </div>
        {toGo > 0 ? (
          <>
            <div className="mt-1.5 text-[14px] font-semibold leading-snug text-fg">
              Solve {toGo} more to reach {nextTarget} solved
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${doneToTarget}%` }}
              />
            </div>
          </>
        ) : (
          <div className="mt-1.5 text-[14px] font-semibold text-fg">
            All questions cleared — nice! 🎉
          </div>
        )}
      </div>

      {/* community hotspot / social proof */}
      {focusTopic && (
        <div className="rounded-[10px] border border-hairline bg-canvas p-3.5">
          <div className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-fg-muted">
            Community hotspot
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-fg">
            <span className="font-semibold">{struggling} students</span> are
            struggling with <span className="font-semibold">{focusTopic}</span>{" "}
            this week.
          </p>
          <p className="mt-1.5 text-[12px] text-fg-muted">
            You&apos;re at {focusPct}% here — crack it to pull ahead of the pack.
          </p>
        </div>
      )}

      {/* compact promo carousel — fills the remaining height */}
      <div className="relative min-h-[188px] flex-1 overflow-hidden rounded-[10px]">
        <div
          className="flex h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {PROMOS.map((p) => (
            <div
              key={p.title}
              className="relative flex h-full w-full shrink-0 flex-col justify-between overflow-hidden p-4 text-white"
              style={{ background: p.bg }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-5 select-none text-[120px] leading-none text-white/10"
              >
                {p.glyph}
              </span>
              <div className="relative">
                <span className="inline-flex rounded-[5px] bg-white/15 px-2 py-0.5 text-[10.5px] font-semibold">
                  {p.kicker}
                </span>
                <h3 className="mt-2.5 text-[19px] font-bold leading-[1.08] tracking-[-0.01em]">
                  {p.title}
                </h3>
              </div>
              <div className="relative">
                <p className="text-[12px] leading-snug text-white/85">{p.sub}</p>
                <Link
                  href={p.href}
                  className="mt-2.5 inline-flex h-8 items-center rounded-[7px] bg-white px-3 text-[12px] font-semibold text-fg transition-opacity hover:opacity-90"
                >
                  {p.cta} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
