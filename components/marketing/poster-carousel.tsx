"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Poster {
  kicker: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  bg: string;
  glyph: string; // big translucent decorative mark
}

const POSTERS: Poster[] = [
  {
    kicker: "OPPE 1 & OPPE 2",
    title: "Own the exam.",
    sub: "Practise until it feels like second nature.",
    cta: "Start practising",
    href: "/app/subjects",
    bg: "linear-gradient(160deg,#4a39b8,#221645)",
    glyph: "◎",
  },
  {
    kicker: "Leaderboard",
    title: "Climb to the top.",
    sub: "Every question you solve moves you up the board.",
    cta: "See rankings",
    href: "/leaderboard",
    bg: "linear-gradient(160deg,#0f6a4c,#083b2b)",
    glyph: "▲",
  },
  {
    kicker: "Mock tests",
    title: "Beat the clock.",
    sub: "Full timed mocks that feel like the real thing.",
    cta: "Take a test",
    href: "/app/subjects",
    bg: "linear-gradient(160deg,#a11f57,#521133)",
    glyph: "◷",
  },
  {
    kicker: "Practise more",
    title: "No limits.",
    sub: "Unlimited questions and full mock tests, whenever you want to practise.",
    cta: "Explore",
    href: "/app/subjects",
    bg: "linear-gradient(160deg,#15468c,#0b2450)",
    glyph: "∞",
  },
];

export function PosterCarousel() {
  const [i, setI] = useState(0);
  const n = POSTERS.length;

  useEffect(() => {
    const id = window.setInterval(() => setI((p) => (p + 1) % n), 4500);
    return () => window.clearInterval(id);
  }, [n]);

  return (
    <div>
      <div className="relative h-[320px] overflow-hidden rounded-[10px] lg:h-[85vh]">
        <div
          className="flex h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {POSTERS.map((p) => (
            <div
              key={p.title}
              className="relative flex h-full w-full shrink-0 flex-col justify-between overflow-hidden p-6 text-white"
              style={{ background: p.bg }}
            >
              {/* decorative glyph, bleeding off */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 select-none text-[190px] leading-none text-white/10"
              >
                {p.glyph}
              </span>

              <div className="relative">
                <span className="inline-flex rounded-[6px] bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold">
                  {p.kicker}
                </span>
                <h3 className="mt-4 text-[26px] font-bold leading-[1.05] tracking-[-0.01em]">
                  {p.title}
                </h3>
              </div>

              <div className="relative">
                <p className="max-w-[22ch] text-[14px] leading-relaxed text-white/85">
                  {p.sub}
                </p>
                <Link
                  href={p.href}
                  className="mt-4 inline-flex h-9 items-center rounded-[8px] bg-white px-4 text-[13px] font-semibold text-fg transition-opacity hover:opacity-90"
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
