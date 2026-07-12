"use client";

import { useState } from "react";
import { cn, formatClock } from "@/lib/utils";
import { RankMedal } from "@/components/progress/rank-medal";

export interface CompareSolution {
  user_id: string;
  name: string;
  best_time: number;
  code: string | null;
  note: string | null;
  me: boolean;
}

function SolutionCard({
  title,
  time,
  code,
  note,
  empty,
  accent,
}: {
  title: string;
  time?: number;
  code: string | null;
  note: string | null;
  empty?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-hairline bg-canvas">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span
          className={cn(
            "text-[13.5px] font-semibold",
            accent ? "text-accent" : "text-fg",
          )}
        >
          {title}
        </span>
        {time != null && (
          <span className="tnum rounded-full bg-surface px-2 py-0.5 text-[11.5px] font-medium text-fg-muted">
            {formatClock(time)}
          </span>
        )}
      </div>
      {code ? (
        <pre className="max-h-[340px] overflow-auto bg-[#0f0b1e] p-4 font-mono text-[12.5px] leading-relaxed text-white/90">
          {code}
        </pre>
      ) : (
        <div className="px-4 py-8 text-center text-[13px] text-fg-muted">
          {empty ?? "No code shared."}
        </div>
      )}
      {note && (
        <div className="border-t border-hairline px-4 py-3">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-muted">
            Their notes
          </div>
          <p className="text-[13px] leading-relaxed text-fg">{note}</p>
        </div>
      )}
    </div>
  );
}

export function SolutionCompare({
  mine,
  solutions,
}: {
  mine: { code: string | null; note: string | null } | null;
  solutions: CompareSolution[];
}) {
  const others = solutions.filter((s) => !s.me);
  const pool = others.length > 0 ? others : solutions;
  const [sel, setSel] = useState(0);
  const active = pool[sel];

  if (!active) {
    return (
      <p className="rounded-[10px] border border-hairline bg-canvas px-4 py-8 text-center text-[14px] text-fg-muted">
        No shared solutions yet — be the first to submit one.
      </p>
    );
  }

  return (
    <div>
      {/* topper selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pool.map((s, i) => (
          <button
            key={s.user_id}
            type="button"
            onClick={() => setSel(i)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-[8px] border-2 px-3 py-1.5 text-[13px] transition-colors",
              i === sel
                ? "border-accent-border bg-accent-weak text-fg"
                : "border-hairline bg-canvas text-fg-muted hover:text-fg",
            )}
          >
            {i < 3 ? (
              <RankMedal rank={i + 1} className="h-5 w-auto" />
            ) : (
              <span className="tnum text-[11px] font-semibold">{i + 1}</span>
            )}
            <span className="font-medium">{s.name}</span>
            <span className="tnum text-[11.5px] text-fg-muted">
              {formatClock(s.best_time)}
            </span>
          </button>
        ))}
      </div>

      {/* side-by-side compare */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SolutionCard
          title="Your solution"
          accent
          code={mine?.code ?? null}
          note={mine?.note ?? null}
          empty="Solve and submit this question to see your own code here and compare it."
        />
        <SolutionCard
          title={`${active.name}'s solution`}
          time={active.best_time}
          code={active.code}
          note={active.note}
        />
      </div>
    </div>
  );
}
