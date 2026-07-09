import * as React from "react";
import { cn } from "@/lib/utils";
import type { Difficulty as DifficultyLevel } from "@/lib/types";

/** Quiet hairline label — used for tags and question kind. */
export function Tag({
  className,
  solid = false,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { solid?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-6 rounded-md px-2 text-[12px] font-medium",
        solid
          ? "bg-fg text-canvas"
          : "border border-hairline text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

const difficultyFill: Record<DifficultyLevel, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * Monochrome difficulty meter — three ascending bars, filled by level.
 * No colour: hierarchy from how many bars are inked.
 */
export function Difficulty({
  level,
  showLabel = true,
  className,
}: {
  level: DifficultyLevel;
  showLabel?: boolean;
  className?: string;
}) {
  const filled = difficultyFill[level];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-[1px]",
              i < filled ? "bg-fg" : "bg-hairline-strong",
            )}
            style={{ height: `${6 + i * 3}px` }}
          />
        ))}
      </span>
      {showLabel && (
        <span className="text-[13px] text-fg-muted capitalize">{level}</span>
      )}
    </span>
  );
}
