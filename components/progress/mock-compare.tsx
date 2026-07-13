"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";

export interface CompareItem {
  questionId: string;
  title: string;
  myCode: string | null;
  topName: string | null;
  topCode: string | null;
  solution: string | null;
}

function CodeCol({
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
        {subtitle && (
          <div className="text-[11.5px] text-fg-muted">{subtitle}</div>
        )}
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

/** Three-way compare for a question: your code, the top solver's, the model. */
export function MockCompare({ items }: { items: CompareItem[] }) {
  const [sel, setSel] = useState(0);
  if (items.length === 0) return null;
  const active = items[Math.min(sel, items.length - 1)];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-fg">Compare solutions</h3>
          <p className="text-[12.5px] text-fg-muted">
            Your code, the fastest solver&apos;s, and the model solution.
          </p>
        </div>
        <select
          value={sel}
          onChange={(e) => setSel(Number(e.target.value))}
          aria-label="Choose a question to compare"
          className="h-10 max-w-[16rem] rounded-[8px] border border-hairline-strong bg-canvas px-3 text-[13.5px] text-fg focus:outline-none focus-visible:border-accent"
        >
          {items.map((it, i) => (
            <option key={it.questionId} value={i}>
              {it.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <CodeCol
          title="You solved"
          accent
          code={active.myCode}
          empty="You haven't submitted this question."
        />
        <CodeCol
          title="Top solver"
          subtitle={active.topName ?? undefined}
          code={active.topCode}
          empty="No shared solution yet."
        />
        <CodeCol
          title="Model solution"
          solution={active.solution}
          empty="A model solution is coming soon."
        />
      </div>
    </div>
  );
}
