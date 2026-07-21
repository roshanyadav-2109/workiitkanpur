"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SubjectLogo } from "@/components/subject-logo";
import { IconLockFilled } from "@/components/icons";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { degreeLabel, type Curriculum } from "@/lib/curriculum";

export interface SubjectCard {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  total: number;
  solved: number;
  showProgress: boolean;
  exams: string[];
  branches: string[]; // degree ids this subject is offered in
  levels: string[];
  // One entry per branch the subject is offered in, with that branch's levels.
  offerings: { branch: string; levels: string[] }[];
}

const LEVEL_ORDER = ["Foundation", "Diploma", "Degree"];

export function SubjectsBrowser({
  cards,
  curriculum,
}: {
  cards: SubjectCard[];
  curriculum: Curriculum;
}) {
  const [branch, setBranch] = useState("all");
  const [level, setLevel] = useState("all");

  // Filter options come only from offerings the subjects actually carry.
  const branches = useMemo(
    () =>
      Array.from(new Set(cards.flatMap((c) => c.branches))).sort((a, b) =>
        degreeLabel(curriculum, a).localeCompare(degreeLabel(curriculum, b)),
      ),
    [cards, curriculum],
  );
  const levels = useMemo(
    () =>
      Array.from(new Set(cards.flatMap((c) => c.levels))).sort(
        (a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b),
      ),
    [cards],
  );

  const filtered = useMemo(
    () =>
      cards.filter((c) => {
        if (branch !== "all" && !c.branches.includes(branch)) return false;
        if (level !== "all" && !c.levels.includes(level)) return false;
        return true;
      }),
    [cards, branch, level],
  );

  return (
    <>
      {/* Filter row */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {branches.length > 0 && (
          <div className="w-[15rem] max-w-full">
            <Select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              aria-label="Filter by branch"
              className="h-11 rounded-[8px] border-[#3d3d3d]! text-[15px] focus-visible:border-[#3d3d3d]!"
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
          <div className="w-[11rem] max-w-full">
            <Select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-label="Filter by level"
              className="h-11 rounded-[8px] border-[#3d3d3d]! text-[15px] focus-visible:border-[#3d3d3d]!"
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No subjects match"
          description="Try a different branch or level."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <SubjectCardView key={s.id} s={s} curriculum={curriculum} />
          ))}
        </div>
      )}
    </>
  );
}

function SubjectCardView({
  s,
  curriculum,
}: {
  s: SubjectCard;
  curriculum: Curriculum;
}) {
  const pct = s.total ? Math.round((s.solved / s.total) * 100) : 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#3d3d3d] bg-white">
      {/* Header — colourful logo tile + name + level pills. */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-surface">
          <SubjectLogo
            slug={s.slug}
            size={26}
            className={s.active ? "" : "opacity-40 grayscale"}
          />
        </span>
        <div className="min-w-0">
          <h3
            className={
              "truncate text-[15.5px] font-semibold leading-snug " +
              (s.active ? "text-fg" : "text-fg-muted")
            }
          >
            {s.name}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 py-4">
        {s.offerings.length > 0 && (
          <div className="mb-2.5 space-y-1">
            {s.offerings.map((o) => (
              <p
                key={o.branch}
                className="text-[16px] font-normal leading-snug text-fg"
              >
                {degreeLabel(curriculum, o.branch)} | {o.levels.join(" | ")}
              </p>
            ))}
          </div>
        )}
        {s.active ? (
          <>
            <p className="text-[13px] text-fg-muted">
              <span className="font-semibold text-fg">{s.total}</span>{" "}
              {s.total === 1 ? "question" : "questions"} available
            </p>

            {s.showProgress && s.total > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 flex justify-end text-[12px]">
                  <span className="tnum text-fg-muted">
                    {s.solved}/{s.total} solved
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                  <div className="h-full bg-ok" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="mb-1.5 text-[12px] font-normal text-fg-muted">
                Exams
              </div>
              {s.exams.length > 0 ? (
                <div className="flex gap-2">
                  {s.exams.map((ex) => (
                    <Link
                      key={ex}
                      href={`/app/subjects/${s.slug}?exam=${encodeURIComponent(ex)}`}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-[8px] bg-accent-weak px-3 text-[12.5px] font-medium text-accent transition-colors hover:bg-accent hover:text-accent-fg"
                    >
                      {ex}
                    </Link>
                  ))}
                </div>
              ) : (
                <span className="text-[12.5px] text-fg-faint">
                  To be announced
                </span>
              )}
            </div>

            <Link
              href={`/app/subjects/${s.slug}`}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:from-[#7a6ae8] hover:to-[#6455dd]"
            >
              Open subject →
            </Link>
          </>
        ) : (
          <span className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] bg-accent-weak px-5 text-[13px] font-medium text-accent">
            <IconLockFilled size={16} />
            Coming soon
          </span>
        )}
      </div>
    </div>
  );
}
