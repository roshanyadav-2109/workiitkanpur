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
    note: "Previous years' OPPE papers, sat exactly as they were set.",
    available: true,
  },
  {
    id: "resources",
    label: "Resources",
    note: "Notes, cheat-sheets, and references for the subject.",
    available: false,
  },
];

/** Section switcher for a subject.
 *  Desktop: a left section sidebar.
 *  Mobile: a horizontal, scrollable filter row of chips below the title.
 *  Content renders once either way — Practice renders `children`, Test Series
 *  renders `testSeries`; the rest are placeholders until their content ships. */
export function SubjectSections({
  children,
  testSeries,
  pyqs,
}: {
  children: React.ReactNode;
  testSeries?: React.ReactNode;
  pyqs?: React.ReactNode;
}) {
  const [active, setActive] = useState("practice");
  const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  const chip =
    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] border px-3.5 py-2 text-[13.5px] font-medium transition-colors";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-7">
      {/* Desktop — left section nav. It scrolls away with the banner, then pins
          just under the (sticky, h-14) navbar so only the question list keeps
          moving. `self-start` is what makes that work: a stretched flex child
          fills the row and has nowhere to stick to. */}
      <aside className="hidden shrink-0 lg:sticky lg:top-[72px] lg:block lg:w-56 lg:self-start">
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

      {/* Content column */}
      <div className="min-w-0 flex-1">
        {/* Mobile — horizontal scrollable filter row */}
        <div className="-mx-3 mb-4 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  chip,
                  on
                    ? "border-transparent bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-white ring-1 ring-inset ring-white/20"
                    : "border-hairline text-fg-muted hover:border-[#3d3d3d] hover:text-fg",
                )}
              >
                <span>{s.label}</span>
                {!s.available && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-normal",
                      on ? "bg-white/20 text-white" : "bg-surface text-fg-faint",
                    )}
                  >
                    soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <section className="rounded-[3px] border border-hairline p-3 sm:p-4 lg:p-5">
          {/* Desktop keeps the strong section header; on mobile the chip is the label */}
          <header className="mb-5 hidden rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-6 py-5 ring-1 ring-inset ring-white/20 lg:block">
            <h2 className="text-[28px] font-normal tracking-[-0.01em] text-white">
              {current.label}
            </h2>
          </header>
          {active === "practice" ? (
            children
          ) : active === "test-series" ? (
            testSeries
          ) : active === "pyqs" ? (
            pyqs
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
