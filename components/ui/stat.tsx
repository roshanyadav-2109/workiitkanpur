import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A single data-forward figure. `focal` uses weight 600 (the one place per
 * screen it is allowed); everything else stays at 500. Numbers are tabular.
 */
export function Stat({
  label,
  value,
  hint,
  focal = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  focal?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <div className="text-[12px] font-medium tracking-[0.02em] text-fg-muted">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 tnum",
          focal
            ? "text-[34px] leading-none font-semibold tracking-[-0.02em]"
            : "text-[24px] leading-none font-medium tracking-[-0.01em]",
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-[13px] text-fg-muted">{hint}</div>
      ) : null}
    </div>
  );
}
