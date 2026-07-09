import * as React from "react";
import { cn, formatClock } from "@/lib/utils";
import { IconTimer } from "@/components/icons";

/** Presentational clock readout. Tabular figures so the width never jitters. */
export function TimerDisplay({
  seconds,
  running = true,
  size = "md",
  className,
}: {
  seconds: number;
  running?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const text = {
    sm: "text-[14px]",
    md: "text-[15px]",
    lg: "text-[22px]",
  }[size];
  const icon = size === "lg" ? 18 : 16;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 tnum font-medium",
        running ? "text-fg" : "text-fg-muted",
        text,
        className,
      )}
    >
      <IconTimer size={icon} className={running ? "text-fg" : "text-fg-faint"} />
      {formatClock(seconds)}
    </span>
  );
}
