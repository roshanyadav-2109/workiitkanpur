import * as React from "react";
import { cn } from "@/lib/utils";

/** Quiet, left-aligned empty state — no illustration, no hero. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-hairline bg-canvas px-6 py-10",
        className,
      )}
    >
      <p className="text-[15px] font-medium text-fg">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-[52ch] text-[14px] leading-relaxed text-fg-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
