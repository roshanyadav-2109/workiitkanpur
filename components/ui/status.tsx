import * as React from "react";
import { cn } from "@/lib/utils";
import { IconCheck, IconCircle, IconHalfCircle } from "@/components/icons";

export type QuestionStatus = "solved" | "attempted" | "unsolved";

const labels: Record<QuestionStatus, string> = {
  solved: "Solved",
  attempted: "Attempted",
  unsolved: "Unsolved",
};

/** Status indicator — one of the few sanctioned uses of an icon. */
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
  const tone =
    status === "solved"
      ? "text-accent"
      : status === "attempted"
        ? "text-fg-muted"
        : "text-fg-faint";
  const Icon =
    status === "solved"
      ? IconCheck
      : status === "attempted"
        ? IconHalfCircle
        : IconCircle;
  return (
    <span className={cn("inline-flex items-center gap-2", tone, className)}>
      <Icon size={size} />
      {showLabel && <span className="text-[13px]">{labels[status]}</span>}
    </span>
  );
}
