import * as React from "react";
import { cn } from "@/lib/utils";

export type QuestionStatus = "solved" | "attempted" | "unsolved" | "wrong";

const labels: Record<QuestionStatus, string> = {
  solved: "Solved",
  attempted: "Attempted",
  unsolved: "Unsolved",
  wrong: "Wrong",
};

const labelTone: Record<QuestionStatus, string> = {
  solved: "text-ok",
  attempted: "text-warn",
  unsolved: "text-warn",
  wrong: "text-err",
};

/**
 * Traffic-light status: a plain filled disc — green when solved, yellow while
 * unsolved/attempted, red when wrong. No tick/cross glyphs, just the colour.
 */
export function StatusIndicator({
  status,
  showLabel = false,
  size = 16,
  className,
}: {
  status: QuestionStatus;
  showLabel?: boolean;
  size?: number;
  className?: string;
}) {
  const dot = Math.round(size * 0.7);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className={cn(
          "shrink-0 rounded-full",
          status === "solved" && "bg-ok",
          status === "wrong" && "bg-err",
          (status === "attempted" || status === "unsolved") && "bg-warn",
        )}
        style={{ width: dot, height: dot }}
      />
      {showLabel && (
        <span className={cn("text-[13px]", labelTone[status])}>
          {labels[status]}
        </span>
      )}
    </span>
  );
}
