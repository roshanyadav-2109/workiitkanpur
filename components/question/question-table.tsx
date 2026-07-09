"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusIndicator, type QuestionStatus } from "@/components/ui/status";
import { Difficulty } from "@/components/ui/tag";
import { Input, Select } from "@/components/ui/input";
import { SegmentedGroup, segmentedItemClass } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSearch } from "@/components/icons";
import { formatClock } from "@/lib/utils";
import type { Difficulty as DifficultyLevel, QuestionKind } from "@/lib/types";

export interface QuestionRow {
  id: string;
  title: string;
  topicId: string | null;
  topicName: string | null;
  week: number | null;
  difficulty: DifficultyLevel;
  kind: QuestionKind;
  tags: string[];
  status: QuestionStatus;
  bestTimeSeconds: number | null;
}

type DifficultyFilter = "all" | DifficultyLevel;
type StatusFilter = "all" | "solved" | "unsolved";

const DIFFICULTY_FILTERS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unsolved", label: "Unsolved" },
  { value: "solved", label: "Solved" },
];

export function QuestionTable({
  rows,
  topics,
}: {
  rows: QuestionRow[];
  topics: { id: string; name: string; week: number | null }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [topic, setTopic] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (difficulty !== "all" && r.difficulty !== difficulty) return false;
      if (topic !== "all" && r.topicId !== topic) return false;
      if (status === "solved" && r.status !== "solved") return false;
      if (status === "unsolved" && r.status === "solved") return false;
      if (q) {
        const hay = `${r.title} ${r.tags.join(" ")} ${r.topicName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, difficulty, topic, status]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xs">
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions"
            className="pl-9"
            aria-label="Search questions"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {topics.length > 0 && (
            <Select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              aria-label="Filter by topic"
              className="w-auto min-w-[10rem]"
            >
              <option value="all">All topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.week != null ? `Week ${t.week} · ` : ""}
                  {t.name}
                </option>
              ))}
            </Select>
          )}

          <SegmentedGroup>
            {DIFFICULTY_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setDifficulty(f.value)}
                className={segmentedItemClass(difficulty === f.value)}
              >
                {f.label}
              </button>
            ))}
          </SegmentedGroup>

          <SegmentedGroup>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                className={segmentedItemClass(status === f.value)}
              >
                {f.label}
              </button>
            ))}
          </SegmentedGroup>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching questions"
          description="Try a different search term or clear the filters."
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-hairline">
          <Table>
            <THead>
              <TR>
                <TH className="w-10 pl-4" />
                <TH>Question</TH>
                <TH className="hidden md:table-cell">Topic</TH>
                <TH>Difficulty</TH>
                <TH className="hidden sm:table-cell text-right pr-4">
                  Best time
                </TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((r) => (
                <TR
                  key={r.id}
                  onClick={(e) => {
                    // Let the title link handle its own (and modifier) clicks.
                    if ((e.target as HTMLElement).closest("a")) return;
                    router.push(`/app/questions/${r.id}`);
                  }}
                  className="cursor-pointer transition-colors hover:bg-surface"
                >
                  <TD className="pl-4">
                    <StatusIndicator status={r.status} />
                  </TD>
                  <TD>
                    <Link
                      href={`/app/questions/${r.id}`}
                      className="font-medium text-[14px] hover:underline"
                    >
                      {r.title}
                    </Link>
                    {r.kind !== "coding" && (
                      <span className="ml-2 align-middle text-[11px] uppercase tracking-[0.04em] text-fg-faint">
                        {r.kind}
                      </span>
                    )}
                  </TD>
                  <TD className="hidden md:table-cell text-[13px] text-fg-muted">
                    {r.week != null ? `W${r.week} · ` : ""}
                    {r.topicName ?? "—"}
                  </TD>
                  <TD>
                    <Difficulty level={r.difficulty} showLabel={false} />
                  </TD>
                  <TD className="hidden sm:table-cell text-right pr-4 tnum text-[13px] text-fg-muted">
                    {r.bestTimeSeconds != null
                      ? formatClock(r.bestTimeSeconds)
                      : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
