"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { SchemaColumn, SchemaTable } from "@/lib/databases";

/**
 * The schema a student reads while writing SQL under exam conditions.
 *
 * Two decisions drive the whole thing:
 *
 * Identifiers are set in mono, because they are strings to be typed exactly —
 * `assistant_referee_1` is not prose, and a proportional face invites a typo.
 *
 * Relationships are text, not drawn lines. A foreign key reads "→ teams.team_id"
 * on its own row and jumps to that table when pressed. Curves between boxes look
 * like a schema diagram but are slow to trace, break on a narrow screen, and
 * can't be searched — and searching is what someone forty minutes into a paper
 * actually does when they can't remember which table holds `jersey_no`.
 */
export function SchemaReference({
  label,
  blurb,
  tables,
}: {
  label: string;
  blurb?: string;
  tables: SchemaTable[];
}) {
  const [q, setQ] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const needle = q.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!needle) return tables;
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.columns.some((c) => c.name.toLowerCase().includes(needle)),
    );
  }, [tables, needle]);

  const columnCount = tables.reduce((n, t) => n + t.columns.length, 0);

  /** Jump to a table named in a foreign key and mark it briefly. */
  function goTo(tableName: string) {
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-table="${CSS.escape(tableName)}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    setFlash(tableName);
    window.setTimeout(() => setFlash((f) => (f === tableName ? null : f)), 1400);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-hairline pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            className="text-[19px] tracking-[-0.01em] text-fg"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {label}
          </h2>
          <span className="font-mono text-[11.5px] tabular-nums text-fg-faint">
            {tables.length} tables · {columnCount} columns
          </span>
        </div>
        {blurb && (
          <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
            {blurb}
          </p>
        )}

        <label className="mt-3 block">
          <span className="sr-only">Filter tables and columns</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter tables and columns"
            spellCheck={false}
            autoComplete="off"
            className="h-9 w-full rounded-[3px] border border-hairline-strong bg-canvas px-3 font-mono text-[13px] text-fg placeholder:font-sans placeholder:text-fg-faint focus-visible:border-accent focus-visible:outline-none"
          />
        </label>
      </header>

      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto pt-4">
        {shown.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-fg-muted">
            No table or column matches{" "}
            <span className="font-mono text-fg">{q.trim()}</span>.
          </p>
        ) : (
          // Column flow rather than a grid: tables are different sizes and
          // shouldn't be padded out to match each other.
          <div className="[column-fill:balance] gap-4 sm:columns-2 xl:columns-3">
            {shown.map((t) => (
              <Table
                key={t.name}
                table={t}
                needle={needle}
                flashing={flash === t.name}
                onJump={goTo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Table({
  table,
  needle,
  flashing,
  onJump,
}: {
  table: SchemaTable;
  needle: string;
  flashing: boolean;
  onJump: (name: string) => void;
}) {
  return (
    <section
      data-table={table.name}
      className={cn(
        "mb-4 break-inside-avoid rounded-[3px] border bg-canvas transition-colors duration-500",
        flashing ? "border-accent bg-accent-weak" : "border-hairline",
      )}
    >
      <h3 className="flex items-baseline justify-between gap-2 border-b border-hairline px-3 py-2">
        <span className="truncate font-mono text-[13px] font-semibold text-fg">
          {table.name}
        </span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-fg-faint">
          {table.columns.length}
        </span>
      </h3>
      <ul>
        {table.columns.map((c) => (
          <Column key={c.name} col={c} needle={needle} onJump={onJump} />
        ))}
      </ul>
    </section>
  );
}

function Column({
  col,
  needle,
  onJump,
}: {
  col: SchemaColumn;
  needle: string;
  onJump: (name: string) => void;
}) {
  const targetTable = col.fk ? col.fk.split(".")[0] : null;
  return (
    <li className="border-b border-hairline/60 px-3 py-1.5 last:border-b-0">
      <div className="flex items-baseline gap-2">
        {/* A filled rule marks a primary key, a hollow one a foreign key.
            One accent, two weights — no key icons, no colour per table. */}
        <span
          aria-hidden
          className={cn(
            "mt-[3px] h-3 w-[3px] shrink-0 self-start rounded-[1px]",
            col.pk
              ? "bg-accent"
              : col.fk
                ? "border border-accent/50 bg-transparent"
                : "bg-transparent",
          )}
        />
        <span className="min-w-0 flex-1 font-mono text-[12.5px] leading-5 text-fg">
          <Mark text={col.name} needle={needle} />
          {col.pk && (
            <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-accent">
              pk
            </span>
          )}
        </span>
        <span className="shrink-0 font-mono text-[11.5px] leading-5 text-fg-faint">
          {col.type}
        </span>
      </div>

      {col.fk && targetTable && (
        <button
          type="button"
          onClick={() => onJump(targetTable)}
          title={`Go to ${targetTable}`}
          className="ml-[11px] mt-0.5 block font-mono text-[11.5px] text-fg-muted transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
        >
          → {col.fk}
        </button>
      )}
    </li>
  );
}

/** Highlight the filtered substring so a match is findable at a glance. */
function Mark({ text, needle }: { text: string; needle: string }) {
  if (!needle) return <>{text}</>;
  const i = text.toLowerCase().indexOf(needle);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="rounded-[2px] bg-accent-weak text-accent">
        {text.slice(i, i + needle.length)}
      </span>
      {text.slice(i + needle.length)}
    </>
  );
}
