"use client";

import Link from "next/link";
import { cn, formatClock } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { StatusIndicator, type QuestionStatus } from "@/components/ui/status";
import { IconTimer } from "@/components/icons";

export interface ControlsPanelProps {
  isAuthed: boolean;
  status: QuestionStatus;
  seconds: number;
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  rating: number | null;
  onRate: (n: number | null) => void;
  onMark: (s: "attempted" | "solved") => void;
  note: string;
  onNoteChange: (v: string) => void;
  onSaveNote: () => void;
  noteSaved: boolean;
  lastSolveSeconds: number | null;
  bestSeconds: number | null;
  error: string | null;
  isPending: boolean;
  loginHref: string;
}

export function ControlsPanel({
  isAuthed,
  status,
  seconds,
  running,
  onToggle,
  onReset,
  rating,
  onRate,
  onMark,
  note,
  onNoteChange,
  onSaveNote,
  noteSaved,
  lastSolveSeconds,
  bestSeconds,
  error,
  isPending,
  loginHref,
}: ControlsPanelProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-hairline p-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
            Timer
          </span>
          <button
            type="button"
            onClick={onToggle}
            className="text-[12px] text-fg-muted transition-colors hover:text-fg"
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <IconTimer size={20} className={running ? "text-fg" : "text-fg-faint"} />
          <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] tnum">
            {formatClock(seconds)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StatusIndicator status={status} showLabel />
          <button
            type="button"
            onClick={onReset}
            className="text-[12px] text-fg-muted transition-colors hover:text-fg"
          >
            Reset
          </button>
        </div>
      </div>

      {lastSolveSeconds !== null && (
        <div className="rounded-md border border-accent-border bg-accent-weak px-4 py-3 text-[13px]">
          Marked solved in{" "}
          <span className="font-medium tnum">{formatClock(lastSolveSeconds)}</span>.
          {bestSeconds !== null && lastSolveSeconds > bestSeconds && (
            <>
              {" "}
              Your best is{" "}
              <span className="font-medium tnum">{formatClock(bestSeconds)}</span>.
            </>
          )}
        </div>
      )}

      <div>
        <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
          How hard did it feel?
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Rate ${n} of 5`}
              onClick={() => onRate(rating === n ? null : n)}
              className={cn(
                "h-8 w-8 rounded-md border text-[13px] tnum transition-colors",
                rating !== null && n <= rating
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-hairline-strong text-fg-muted hover:bg-surface",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {isAuthed ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => onMark("attempted")}
            disabled={isPending}
          >
            Mark attempted
          </Button>
          <Button
            variant="primary"
            onClick={() => onMark("solved")}
            disabled={isPending}
          >
            Mark solved
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-hairline bg-surface px-4 py-3 text-[13px] text-fg-muted">
          <Link href={loginHref} className="text-accent underline underline-offset-2">
            Sign in
          </Link>{" "}
          to save attempts, ratings, and notes.
        </div>
      )}

      {error && <p className="text-[13px] text-fg">{error}</p>}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
            Notes
          </span>
          {noteSaved && <span className="text-[11px] text-fg-muted">Saved</span>}
        </div>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Jot the approach, a gotcha, the edge case you missed…"
          className="min-h-[120px] text-[13px]"
          disabled={!isAuthed}
        />
        <div className="mt-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onSaveNote}
            disabled={!isAuthed || isPending}
          >
            Save note
          </Button>
        </div>
      </div>
    </div>
  );
}
