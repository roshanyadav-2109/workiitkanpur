"use client";

import { useMemo, useState } from "react";
import { Markdown } from "@/components/markdown";
import { IconChevron } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface CompareItem {
  questionId: string;
  title: string;
  section: string;
  week: number | null;
  body: string;
  myCode: string | null;
  topName: string | null;
  topCode: string | null;
  solution: string | null;
}

function AnswerCol({
  title,
  subtitle,
  code,
  solution,
  empty,
  accent,
}: {
  title: string;
  subtitle?: string;
  code?: string | null;
  solution?: string | null;
  empty: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-hairline bg-canvas">
      <div className="border-b border-hairline px-3.5 py-2.5">
        <div
          className={
            "text-[13px] font-semibold " + (accent ? "text-accent" : "text-fg")
          }
        >
          {title}
        </div>
        {subtitle && <div className="text-[11.5px] text-fg-muted">{subtitle}</div>}
      </div>
      {solution !== undefined ? (
        solution ? (
          <div className="prose-oppe max-h-[300px] overflow-auto p-3.5 text-[13px]">
            <Markdown>{solution}</Markdown>
          </div>
        ) : (
          <div className="px-3.5 py-8 text-center text-[13px] text-fg-muted">
            {empty}
          </div>
        )
      ) : code ? (
        <pre className="max-h-[300px] overflow-auto bg-[#0f0b1e] p-3.5 font-mono text-[12px] leading-relaxed text-white/90">
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
  // Group questions by section (topic), ordered by week.
  const sections = useMemo(() => {
    const map = new Map<string, CompareItem[]>();
    for (const it of items) {
      const arr = map.get(it.section);
      if (arr) arr.push(it);
      else map.set(it.section, [it]);
    }
    return [...map.entries()]
      .map(([name, qs]) => ({ name, week: qs[0].week, qs }))
      .sort((a, b) => (a.week ?? 99) - (b.week ?? 99));
  }, [items]);

  const [selectedId, setSelectedId] = useState(items[0]?.questionId ?? "");
  const [openSection, setOpenSection] = useState(sections[0]?.name ?? "");
  const active =
    items.find((i) => i.questionId === selectedId) ?? items[0] ?? null;

  if (!active) return null;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-fg">Compare solutions</h3>
        <p className="text-[12.5px] text-fg-muted">
          Pick a question — see your code, the fastest solver&apos;s, and the
          model solution.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:items-start">
        {/* section sidebar */}
        <aside className="overflow-hidden rounded-[10px] border border-hairline bg-canvas">
          {sections.map((s) => {
            const on = openSection === s.name;
            return (
              <div key={s.name} className="border-b border-hairline last:border-0">
                <button
                  type="button"
                  onClick={() => setOpenSection(on ? "" : s.name)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-fg hover:bg-surface"
                >
                  {s.name}
                  <IconChevron
                    size={13}
                    className={cn(
                      "shrink-0 text-fg-muted transition-transform",
                      on ? "rotate-[270deg]" : "rotate-90",
                    )}
                  />
                </button>
                {on && (
                  <ul className="pb-1.5">
                    {s.qs.map((q) => {
                      const sel = q.questionId === active.questionId;
                      return (
                        <li key={q.questionId}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(q.questionId)}
                            className={cn(
                              "flex w-full items-center gap-1.5 py-1.5 pl-4 pr-3 text-left text-[12.5px] transition-colors",
                              sel
                                ? "font-semibold text-accent"
                                : "text-fg-muted hover:text-fg",
                            )}
                          >
                            <span className={sel ? "text-accent" : "text-fg-faint"}>
                              ›
                            </span>
                            <span className="truncate">{q.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </aside>

        {/* question + answers */}
        <div className="space-y-4">
          <div className="rounded-[10px] border border-hairline bg-canvas p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-fg-muted">
              {active.section}
            </div>
            <h4 className="mt-1 text-[16px] font-semibold text-fg">
              {active.title}
            </h4>
            <div className="prose-oppe mt-2 max-h-[220px] overflow-auto text-[13.5px]">
              <Markdown>{active.body}</Markdown>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <AnswerCol
              title="You solved"
              accent
              code={active.myCode}
              empty="You haven't submitted this question."
            />
            <AnswerCol
              title="Top solver"
              subtitle={active.topName ?? undefined}
              code={active.topCode}
              empty="No shared solution yet."
            />
            <AnswerCol
              title="Model solution"
              solution={active.solution}
              empty="A model solution is coming soon."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
