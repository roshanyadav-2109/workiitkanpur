"use client";

import { useMemo, useState } from "react";
import { cn, formatDurationHuman, timeAgo } from "@/lib/utils";
import { IconChevron } from "@/components/icons";
import { Select } from "@/components/ui/input";
import { RankMedal } from "@/components/progress/rank-medal";
import { MockCompare, type CompareItem } from "@/components/progress/mock-compare";

export interface MockBoardRow {
  name: string;
  score: number;
  total: number;
  timeSeconds: number;
  me: boolean;
}
export interface MockItem {
  setId: string;
  title: string;
  subject: string;
  score: number;
  total: number;
  timeSeconds: number;
  submittedAt: string;
  rank: number;
  percentileTop: number;
  appeared: number;
  board: MockBoardRow[];
}

export function MockHistory({
  items,
  compare = [],
}: {
  items: MockItem[];
  compare?: CompareItem[];
}) {
  const subjects = useMemo(
    () => Array.from(new Set(items.map((i) => i.subject))),
    [items],
  );
  const [subject, setSubject] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = items.filter(
    (i) => subject === "all" || i.subject === subject,
  );

  // If the filter narrows to a single set, jump straight to its detail screen.
  const soleId = filtered.length === 1 ? filtered[0].setId : null;
  const activeId = soleId ?? selectedId;
  const active = activeId
    ? filtered.find((i) => i.setId === activeId) ?? null
    : null;

  // The right-hand leaderboard block always shows *something*: the open set in
  // detail view, otherwise the most-recent set in the current filter.
  const boardSet = active ?? filtered[0] ?? null;
  const inDetail = active != null;

  return (
    <div className="mt-6">
      {/* top bar: back (in detail) + filter */}
      <div className="mb-4 flex items-center gap-3">
        {inDetail && soleId == null && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="inline-flex h-11 items-center gap-1.5 rounded-[8px] border-2 border-[#3d3d3d] bg-canvas px-3.5 text-[14px] font-medium text-fg transition-colors hover:bg-surface"
          >
            <IconChevron size={15} className="rotate-180" />
            Back
          </button>
        )}
        <div className="w-[15rem] max-w-full">
          <Select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setSelectedId(null);
            }}
            aria-label="Filter mocks by subject"
            className="h-11 rounded-[8px] border-[#3d3d3d]! text-[14px] focus-visible:border-[#3d3d3d]!"
          >
            <option value="all">All mocks ({items.length})</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s} ({items.filter((i) => i.subject === s).length})
              </option>
            ))}
          </Select>
        </div>
        {inDetail && (
          <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-fg">
            {active!.title}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* left: list of sets OR the selected set's detailed analysis */}
        <div>
          {inDetail ? (
            <SetDetail item={active!} compare={compare} />
          ) : (
            <div className="space-y-2.5">
              {filtered.map((m) => (
                <button
                  key={m.setId}
                  type="button"
                  onClick={() => setSelectedId(m.setId)}
                  className="flex w-full items-center gap-3 rounded-[8px] border-2 border-[#3d3d3d] bg-canvas px-4 py-3.5 text-left transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold">
                      {m.title}
                    </div>
                    <div className="text-[12px] text-fg-muted">
                      Appeared {timeAgo(m.submittedAt)} · {m.appeared} students
                    </div>
                  </div>
                  <Badge label="Score" value={`${m.score}/${m.total}`} />
                  <Badge label="Rank" value={`#${m.rank}`} />
                  <Badge
                    label="Percentile"
                    value={`Top ${m.percentileTop}%`}
                    accent
                  />
                  <IconChevron
                    size={16}
                    className="shrink-0 rotate-90 text-fg-muted"
                  />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="rounded-[8px] border border-hairline bg-canvas px-4 py-6 text-center text-[14px] text-fg-muted">
                  No mocks match this filter.
                </p>
              )}
            </div>
          )}
        </div>

        {/* right: fixed leaderboard block for the active/most-recent set */}
        <aside className="lg:sticky lg:top-[74px]">
          {boardSet ? (
            <LeaderboardBlock item={boardSet} />
          ) : (
            <div className="rounded-[10px] border border-hairline bg-canvas p-5 text-[13px] text-fg-muted">
              No leaderboard to show yet.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ── Detailed analysis of one set ──────────────────────────────────────── */
function SetDetail({
  item,
  compare,
}: {
  item: MockItem;
  compare: CompareItem[];
}) {
  const scores = item.board.map((r) => r.score);
  const times = item.board.map((r) => r.timeSeconds);
  const avgScore = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;
  const avgTime = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;
  const fastest = times.length ? Math.min(...times) : 0;
  const topScore = scores.length ? Math.max(...scores) : item.total;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Your score" value={`${item.score}/${item.total}`} hint={`top ${topScore}/${item.total}`} />
        <Stat label="Your rank" value={`#${item.rank}`} hint={`of ${item.appeared}`} />
        <Stat label="Percentile" value={`Top ${item.percentileTop}%`} hint="vs field" accent />
        <Stat label="Your time" value={formatDurationHuman(item.timeSeconds)} hint={`avg ${formatDurationHuman(avgTime)}`} />
      </div>

      {/* how you stack up */}
      <div className="rounded-[10px] border border-hairline bg-canvas p-4">
        <div className="text-[13px] font-semibold text-fg">How you compare</div>
        <div className="mt-3 space-y-3">
          <CompareBar
            label="Score"
            you={item.score}
            avg={avgScore}
            best={topScore}
            max={item.total}
            fmt={(v) => `${Math.round(v * 10) / 10}/${item.total}`}
          />
          <CompareBar
            label="Speed"
            you={item.timeSeconds}
            avg={avgTime}
            best={fastest}
            max={Math.max(item.timeSeconds, avgTime, 1)}
            invert
            fmt={(v) => formatDurationHuman(Math.round(v))}
          />
        </div>
        <p className="mt-3 text-[12px] text-fg-muted">
          You beat{" "}
          <span className="font-semibold text-fg">
            {Math.max(0, 100 - item.percentileTop)}%
          </span>{" "}
          of the {item.appeared} students who sat this set.
        </p>
      </div>

      {/* three-way solution comparison */}
      {compare.length > 0 && (
        <div className="rounded-[10px] border border-hairline bg-canvas p-4">
          <MockCompare items={compare} />
        </div>
      )}
    </div>
  );
}

function CompareBar({
  label,
  you,
  avg,
  best,
  max,
  invert = false,
  fmt,
}: {
  label: string;
  you: number;
  avg: number;
  best: number;
  max: number;
  invert?: boolean;
  fmt: (v: number) => string;
}) {
  const pct = (v: number) => `${Math.min(100, Math.max(3, (v / max) * 100))}%`;
  // For speed, lower is better — show it, but the bar length still maps to value.
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-fg-muted">{label}</span>
        <span className="font-semibold text-fg">
          {fmt(you)}
          <span className="ml-1.5 font-normal text-fg-faint">
            {invert
              ? you <= avg
                ? "· faster than avg"
                : "· slower than avg"
              : you >= avg
                ? "· above avg"
                : "· below avg"}
          </span>
        </span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-hairline">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: pct(you) }}
        />
        {/* avg marker */}
        <div
          className="absolute inset-y-[-2px] w-0.5 rounded bg-[#3d3d3d]"
          style={{ left: pct(avg) }}
          title={`avg ${fmt(avg)}`}
        />
      </div>
    </div>
  );
}

/* ── Leaderboard block (right column) ──────────────────────────────────── */
function LeaderboardBlock({ item }: { item: MockItem }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-hairline bg-canvas">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="text-[14px] font-semibold text-fg">Leaderboard</div>
        <div className="text-[11.5px] text-fg-muted">{item.appeared} sat</div>
      </div>
      <div className="max-h-[520px] space-y-1.5 overflow-auto p-3">
        {item.board.map((r, i) => (
          <div
            key={`${r.name}-${i}`}
            className={cn(
              "flex items-center gap-3 rounded-[6px] px-3 py-2 text-[13.5px]",
              r.me ? "bg-accent-weak" : "bg-canvas",
            )}
          >
            {i < 3 ? (
              <RankMedal rank={i + 1} className="h-7 w-auto shrink-0" />
            ) : (
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-hairline-strong text-[11px] font-bold text-white">
                {i + 1}
              </span>
            )}
            <span className="flex-1 truncate font-medium">
              {r.me ? <span className="font-semibold text-accent">You</span> : r.name}
            </span>
            <span className="tnum w-12 text-right">
              {r.score}/{r.total}
            </span>
            <span className="tnum w-14 text-right text-[12px] text-fg-muted">
              {formatDurationHuman(r.timeSeconds)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── small shared bits ─────────────────────────────────────────────────── */
function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border p-3",
        accent
          ? "border-accent-border bg-accent-weak"
          : "border-hairline bg-canvas",
      )}
    >
      <div className="text-[11.5px] text-fg-muted">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-[19px] font-semibold tracking-[-0.01em]",
          accent && "text-accent",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-fg-faint">{hint}</div>
    </div>
  );
}

function Badge({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "hidden items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[12.5px] sm:inline-flex",
        accent
          ? "border-accent-border bg-accent-weak text-accent"
          : "border-hairline-strong text-fg",
      )}
    >
      <span className="text-fg-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
