"use client";

import { useMemo, useState } from "react";
import { Markdown } from "@/components/markdown";
import { IconChevron } from "@/components/icons";
import { Select } from "@/components/ui/input";
import { RankMedal } from "@/components/progress/rank-medal";
import { cn } from "@/lib/utils";

export interface CompareItem {
  questionId: string;
  title: string;
  section: string;
  week: number | null;
  body: string;
  samples: { stdin: string; expected: string }[];
  myCode: string | null;
  tops: { name: string; code: string | null }[];
  solution: string | null;
}

function AnswerCol({
  title,
  header,
  code,
  solution,
  empty,
  accent,
}: {
  title: string;
  header?: React.ReactNode;
  code?: string | null;
  solution?: string | null;
  empty: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-hairline bg-canvas">
      <div className="flex min-h-[46px] items-center justify-between gap-2 border-b border-hairline px-3.5 py-2">
        <div
          className={
            "text-[13px] font-semibold " + (accent ? "text-accent" : "text-fg")
          }
        >
          {title}
        </div>
        {header}
      </div>
      {solution !== undefined ? (
        solution ? (
          <div className="prose-oppe max-h-[320px] overflow-auto p-3.5 text-[13px]">
            <Markdown>{solution}</Markdown>
          </div>
        ) : (
          <div className="px-3.5 py-8 text-center text-[13px] text-fg-muted">
            {empty}
          </div>
        )
      ) : code ? (
        <pre className="max-h-[320px] overflow-auto bg-[#0f0b1e] p-3.5 font-mono text-[12px] leading-relaxed text-white/90">
          {code}
        </pre>
      ) : (
        <div className="px-3.5 py-8 text-center text-[13px] text-fg-muted">
          {empty}
        </div>
      )}
    </div>
  );
}

export function MockCompare({ items }: { items: CompareItem[] }) {
  // Sections (topics) ordered by week.
  const sections = useMemo(() => {
    const seen = new Map<string, number | null>();
    for (const it of items) if (!seen.has(it.section)) seen.set(it.section, it.week);
    return [...seen.entries()]
      .sort((a, b) => (a[1] ?? 99) - (b[1] ?? 99))
      .map(([name]) => name);
  }, [items]);

  const [section, setSection] = useState(sections[0] ?? "");
  const [idx, setIdx] = useState(0);
  const [topRank, setTopRank] = useState(0);

  const inSection = items.filter((i) => i.section === section);
  const active = inSection[Math.min(idx, inSection.length - 1)] ?? null;
  const top = active?.tops[Math.min(topRank, (active?.tops.length ?? 1) - 1)];

  if (items.length === 0 || !active) return null;

  function move(delta: number) {
    setIdx((i) => {
      const n = inSection.length;
      return ((i + delta) % n + n) % n;
    });
    setTopRank(0);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-fg">Compare solutions</h3>
          <p className="text-[12.5px] text-fg-muted">
            Your code, the top solvers&apos;, and the model solution.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {/* section filter */}
          <div className="min-w-0 flex-1 sm:w-[13rem] sm:flex-none">
            <Select
              value={section}
              onChange={(e) => {
                setSection(e.target.value);
                setIdx(0);
                setTopRank(0);
              }}
              aria-label="Filter by section"
              className="h-10 rounded-[8px] border-[#3d3d3d]! text-[13.5px] focus-visible:border-[#3d3d3d]!"
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s} ({items.filter((i) => i.section === s).length})
                </option>
              ))}
            </Select>
          </div>
          {/* left / right sweep */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous question"
              className="grid h-10 w-10 place-items-center rounded-[8px] border-2 border-[#3d3d3d] bg-canvas text-fg transition-colors hover:bg-surface"
            >
              <IconChevron size={16} className="rotate-180" />
            </button>
            <span className="tnum min-w-[3.5rem] text-center text-[12.5px] text-fg-muted">
              {Math.min(idx, inSection.length - 1) + 1} / {inSection.length}
            </span>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next question"
              className="grid h-10 w-10 place-items-center rounded-[8px] border-2 border-[#3d3d3d] bg-canvas text-fg transition-colors hover:bg-surface"
            >
              <IconChevron size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* the question — sits beside the floated leaderboard (own formatting context) */}
      <div className="overflow-hidden rounded-[10px] border border-hairline bg-canvas p-4">
        <h4 className="text-[16px] font-semibold text-fg">{active.title}</h4>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row">
          <div className="prose-oppe max-h-[240px] flex-1 overflow-auto text-[13.5px]">
            <Markdown>{active.body}</Markdown>
          </div>
          {active.samples.length > 0 && (
            <div className="lg:w-[300px] lg:shrink-0">
              <div className="mb-1.5 text-[11.5px] font-medium text-fg">
                Example
              </div>
              <div className="space-y-2">
                {active.samples.map((s, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 gap-2 rounded-[7px] border border-hairline bg-surface p-2.5 text-[12px]"
                  >
                    <div>
                      <div className="mb-1 text-[11px] text-fg-muted">Input</div>
                      <pre className="whitespace-pre-wrap font-mono text-fg">
                        {s.stdin || "—"}
                      </pre>
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] text-fg-muted">Output</div>
                      <pre className="whitespace-pre-wrap font-mono text-fg">
                        {s.expected || "—"}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* answers — clear the floated leaderboard, full width below it */}
      <div className="mt-4 grid gap-3 lg:clear-right lg:grid-cols-3">
        <AnswerCol
          title="You solved"
          accent
          code={active.myCode}
          empty="You haven't submitted this question."
        />
        <AnswerCol
          title="Top solver"
          header={
            active.tops.length > 0 ? (
              <div className="flex items-center gap-1">
                {active.tops.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopRank(i)}
                    aria-label={`Rank ${i + 1}: ${t.name}`}
                    title={t.name}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full transition-colors",
                      i === Math.min(topRank, active.tops.length - 1)
                        ? "bg-accent-weak"
                        : "opacity-55 hover:opacity-100",
                    )}
                  >
                    <RankMedal rank={i + 1} className="h-5 w-auto" />
                  </button>
                ))}
              </div>
            ) : undefined
          }
          code={top?.code}
          empty="No shared solutions yet."
        />
        <AnswerCol
          title="Model solution"
          solution={active.solution}
          empty="A model solution is coming soon."
        />
      </div>
      {top && (
        <p className="mt-1.5 text-[11.5px] text-fg-muted">
          Showing <span className="font-medium text-fg">{top.name}</span>&apos;s
          solution (rank #{Math.min(topRank, active.tops.length - 1) + 1}).
        </p>
      )}
    </div>
  );
}
