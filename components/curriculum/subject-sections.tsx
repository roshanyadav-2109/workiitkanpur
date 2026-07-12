"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
  note: string;
  available: boolean;
}

const SECTIONS: Section[] = [
  {
    id: "practice",
    label: "Practice",
    note: "Timed practice questions by week and difficulty.",
    available: true,
  },
  {
    id: "test-series",
    label: "Test Series",
    note: "Full-length, timed mock tests under exam conditions.",
    available: true,
  },
  {
    id: "pyqs",
    label: "PYQs",
    note: "Previous years' OPPE questions, organised by term.",
    available: false,
  },
  {
    id: "resources",
    label: "Resources",
    note: "Notes, cheat-sheets, and references for the subject.",
    available: false,
  },
];

/** Section switcher for a subject. Practice renders `children`, Test Series
 *  renders `testSeries`; the rest are placeholders until their content ships. */
export function SubjectSections({
  children,
  testSeries,
}: {
  children: React.ReactNode;
  testSeries?: React.ReactNode;
}) {
  const [active, setActive] = useState("practice");
  const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-7">
      {/* Left section nav */}
      <aside className="shrink-0 lg:w-56">
        <nav className="overflow-hidden rounded-[3px] border border-hairline">
          {SECTIONS.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex w-full items-center justify-between gap-2 border-b border-hairline px-4 py-3 text-left transition-colors last:border-b-0",
                  on
                    ? "bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-[15px] font-semibold text-white ring-1 ring-inset ring-white/20"
                    : "text-[14px] font-normal text-fg-muted hover:text-fg",
                )}
              >
                <span>{s.label}</span>
                {!s.available && (
                  <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-normal text-fg-faint">
                    soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content — one common section block */}
      <div className="min-w-0 flex-1">
        <section className="rounded-[3px] border border-hairline p-4 sm:p-5">
          <header className="mb-5 rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-6 py-5 ring-1 ring-inset ring-white/20">
            <h2 className="text-[28px] font-normal tracking-[-0.01em] text-white">
              {current.label}
            </h2>
          </header>
          {active === "practice" ? (
            children
          ) : active === "test-series" ? (
            testSeries
          ) : (
            <div className="py-12 text-center">
              <p className="text-[15px] font-medium">
                {current.label} — coming soon
              </p>
              <p className="mx-auto mt-1.5 max-w-[52ch] text-[14px] leading-relaxed text-fg-muted">
                {current.note}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
