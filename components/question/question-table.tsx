"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type QuestionStatus } from "@/components/ui/status";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSearch } from "@/components/icons";
import { formatClock, cn } from "@/lib/utils";
import { DEGREE_BY_ID } from "@/lib/curriculum";
import type { QuestionKind } from "@/lib/types";

export interface QuestionRow {
  id: string;
  title: string;
  topicId: string | null;
  topicName: string | null;
  week: number | null;
  kind: QuestionKind;
  exam: string | null;
  branch?: string | null;
  level?: string | null;
  tags: string[];
  status: QuestionStatus;
  bestTimeSeconds: number | null;
}

type StatusFilter = "all" | "solved" | "unsolved";
type KindFilter = "all" | QuestionKind;

const KIND_LABEL: Record<QuestionKind, string> = {
  coding: "Coding",
  mcq: "MCQ",
  sql: "SQL",
  shell: "Shell",
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unsolved", label: "Unsolved" },
  { value: "solved", label: "Solved" },
];

export function QuestionTable({
  rows,
  topics,
  initialExam,
}: {
  rows: QuestionRow[];
  topics: { id: string; name: string; week: number | null }[];
  initialExam?: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [topic, setTopic] = useState<string>("all");
  const [exam, setExam] = useState<string>(initialExam ?? "all");
  const [branch, setBranch] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  // Question-kind (MCQ / coding) filtering stays wired up for when other exam
  // types go live, but the control is hidden while everything is coding-only.
  const [kind] = useState<KindFilter>("all");

  // Filter options come only from tags the questions actually carry.
  const exams = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.exam).filter((e): e is string => !!e)),
    ).sort(),
    [rows],
  );
  const branches = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.branch).filter((b): b is string => !!b)),
    ),
    [rows],
  );
  const levels = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.level).filter((l): l is string => !!l)),
    ),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (topic !== "all" && r.topicId !== topic) return false;
      if (exam !== "all" && r.exam !== exam) return false;
      // Branch/level only narrow when a question actually carries the tag.
      if (branch !== "all" && r.branch && r.branch !== branch) return false;
      if (level !== "all" && r.level && r.level !== level) return false;
      if (kind !== "all" && r.kind !== kind) return false;
      if (status === "solved" && r.status !== "solved") return false;
      if (status === "unsolved" && r.status === "solved") return false;
      if (q) {
        const hay = `${r.title} ${r.tags.join(" ")} ${r.topicName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, topic, exam, branch, level, status, kind]);

  // Bigger controls with a solid black border that doesn't recolour on focus.
  const filterCls =
    "h-11 rounded-[8px] border-[#3d3d3d]! text-[15px] focus-visible:border-[#3d3d3d]!";

  return (
    <div>
      {/* Filters + search in one row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {branches.length > 0 && (
          <div className="w-[13rem] max-w-full">
            <Select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              aria-label="Filter by branch"
              className={filterCls}
            >
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {DEGREE_BY_ID[b]?.name ?? b}
                </option>
              ))}
            </Select>
          </div>
        )}

        {levels.length > 0 && (
          <div className="w-[9.5rem] max-w-full">
            <Select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-label="Filter by level"
              className={filterCls}
            >
              <option value="all">All levels</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
        )}

        {exams.length > 0 && (
          <div className="w-[10rem] max-w-full">
            <Select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              aria-label="Filter by exam"
              className={filterCls}
            >
              <option value="all">All exams</option>
              {exams.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </Select>
          </div>
        )}

        {topics.length > 0 && (
          <div className="w-[12rem] max-w-full">
            <Select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              aria-label="Filter by topic"
              className={filterCls}
            >
              <option value="all">All topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.week != null ? `Week ${t.week} · ` : ""}
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="w-[9rem] max-w-full">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            aria-label="Filter by status"
            className={filterCls}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.value === "all" ? "All status" : f.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="relative min-w-[12rem] flex-1">
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions"
            className={cn("w-full pl-9", filterCls)}
            aria-label="Search questions"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching questions"
          description="Try a different search term or clear the filters."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const solved = r.status === "solved";
            return (
              <div
                key={r.id}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-[8px] border border-[#3d3d3d] px-5 py-4",
                  solved ? "bg-[#e7f6ec]" : "bg-[#f7f7f6]",
                )}
              >
                <div className="min-w-0">
                  <h3 className="truncate text-[15.5px] font-semibold tracking-[-0.005em] text-fg">
                    {r.title}
                  </h3>
                  <p className="mt-1 truncate text-[13px] text-fg-muted">
                    {r.week != null ? `Week ${r.week}` : ""}
                    {r.topicName
                      ? `${r.week != null ? " · " : ""}${r.topicName}`
                      : ""}
                    {r.kind !== "coding" ? ` · ${KIND_LABEL[r.kind]}` : ""}
                    {solved && r.bestTimeSeconds != null ? (
                      <>
                        {" · Best "}
                        <span className="tnum font-medium text-fg">
                          {formatClock(r.bestTimeSeconds)}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>

                <Link
                  href={`/app/questions/${r.id}`}
                  className="inline-flex h-9 shrink-0 items-center rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:from-[#7a6ae8] hover:to-[#6455dd]"
                >
                  {solved ? "Solve again" : "Attempt"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
