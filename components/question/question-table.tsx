"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type QuestionStatus } from "@/components/ui/status";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSearch, IconFilePdf } from "@/components/icons";
import { formatClock, cn } from "@/lib/utils";
import { degreeLabel, type Curriculum } from "@/lib/curriculum";
import { usePhoneGate } from "@/components/phone/phone-gate";
import { logEvent } from "@/lib/activity";
import type { Difficulty, QuestionKind } from "@/lib/types";

export interface QuestionRow {
  id: string;
  title: string;
  topicId: string | null;
  topicName: string | null;
  week: number | null;
  kind: QuestionKind;
  exam: string | null;
  difficulty: Difficulty;
  branch?: string | null;
  level?: string | null;
  tags: string[];
  status: QuestionStatus;
  bestTimeSeconds: number | null;
}

type StatusFilter = "all" | "solved" | "unsolved";
type KindFilter = "all" | QuestionKind;
type DifficultyFilter = "all" | Difficulty;

/**
 * A three-bar meter for a question's difficulty: one bar lit for easy, two for
 * medium, three for hard, in the design system's green/amber/red. Purely
 * visual — no word — with the level in the tooltip and aria-label so hovering
 * and screen readers still get it.
 */
const DIFFICULTY: Record<
  Difficulty,
  { label: string; lit: number; color: string }
> = {
  easy: { label: "Easy", lit: 1, color: "bg-ok" },
  medium: { label: "Medium", lit: 2, color: "bg-[#d97706]" },
  hard: { label: "Hard", lit: 3, color: "bg-err" },
};

function DifficultyMeter({ level }: { level: Difficulty }) {
  const d = DIFFICULTY[level];
  return (
    <span
      className="inline-flex items-end gap-[3px]"
      title={`Difficulty: ${d.label}`}
      aria-label={`Difficulty: ${d.label}`}
      role="img"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "w-[4px] rounded-[1px]",
            i === 0 ? "h-[7px]" : i === 1 ? "h-[10px]" : "h-[13px]",
            i < d.lit ? d.color : "bg-[#d9d7d2]",
          )}
        />
      ))}
    </span>
  );
}

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
  curriculum,
}: {
  rows: QuestionRow[];
  topics: { id: string; name: string; week: number | null }[];
  initialExam?: string;
  curriculum: Curriculum;
}) {
  const router = useRouter();
  const gate = usePhoneGate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [topic, setTopic] = useState<string>("all");
  const [exam, setExam] = useState<string>(initialExam ?? "all");
  const [branch, setBranch] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
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
      if (difficulty !== "all" && r.difficulty !== difficulty) return false;
      if (kind !== "all" && r.kind !== kind) return false;
      if (status === "solved" && r.status !== "solved") return false;
      if (status === "unsolved" && r.status === "solved") return false;
      if (q) {
        const hay = `${r.title} ${r.tags.join(" ")} ${r.topicName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, topic, exam, branch, level, difficulty, status, kind]);

  // Solid black border that doesn't recolour on focus. Compact on mobile,
  // roomier from sm up.
  const filterCls =
    "h-10 rounded-[8px] border-[#3d3d3d]! text-[13.5px] focus-visible:border-[#3d3d3d]! sm:h-11 sm:text-[15px]";

  return (
    <div>
      {/* Filters + search — two per row on mobile, one flowing row from sm up */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-5 sm:flex sm:flex-wrap sm:items-center">
        {branches.length > 0 && (
          <div className="w-full sm:w-[13rem] sm:max-w-full">
            <Select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              aria-label="Filter by branch"
              className={filterCls}
            >
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {degreeLabel(curriculum, b)}
                </option>
              ))}
            </Select>
          </div>
        )}

        {levels.length > 0 && (
          <div className="w-full sm:w-[9.5rem] sm:max-w-full">
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
          <div className="w-full sm:w-[10rem] sm:max-w-full">
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

        <div className="w-full sm:w-[9.5rem] sm:max-w-full">
          <Select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyFilter)}
            aria-label="Filter by difficulty"
            className={filterCls}
          >
            <option value="all">All levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>

        {topics.length > 0 && (
          <div className="w-full sm:w-[12rem] sm:max-w-full">
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

        <div className="w-full sm:w-[9rem] sm:max-w-full">
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

        <div className="relative w-full sm:min-w-[12rem] sm:flex-1">
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="line-clamp-2 min-w-0 text-[15.5px] font-semibold leading-snug tracking-[-0.005em] text-fg sm:truncate">
                      {r.title}
                    </h3>
                    <span className="shrink-0">
                      <DifficultyMeter level={r.difficulty} />
                    </span>
                  </div>
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

                {/* Both actions go through the gate first: the handout carries
                    the solution, and opening a question is the start of solving
                    it. The server enforces this too -- these just make the ask
                    happen here instead of after a bounce. */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      gate.requirePhone(() => {
                        void logEvent({
                          event: "pdf_download",
                          questionId: r.id,
                        });
                        window.location.href = `/api/questions/${r.id}/pdf`;
                      })
                    }
                    title="Download question with solution (PDF)"
                    aria-label={`Download "${r.title}" with solution as PDF`}
                    // solid red tile, white glyph -- reads as "PDF" instantly
                    className="grid h-9 w-9 place-items-center rounded-[3px] bg-err text-white transition-colors hover:bg-[#b91c1c]"
                  >
                    <IconFilePdf size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      gate.requirePhone(() => {
                        void logEvent({
                          event: "question_open",
                          questionId: r.id,
                        });
                        router.push(`/app/questions/${r.id}`);
                      })
                    }
                    className="inline-flex h-9 items-center rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-3.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:from-[#7a6ae8] hover:to-[#6455dd] sm:px-5"
                  >
                    {solved ? "Solve again" : "Attempt"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
