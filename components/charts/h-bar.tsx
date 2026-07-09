import * as React from "react";
import { cn } from "@/lib/utils";

export interface HBarItem {
  label: string;
  /** 0-100 fill percentage. */
  pct: number;
  value: React.ReactNode;
}

/** Horizontal bar list — accuracy by topic and similar. Track hairline, fill inked. */
export function HBarList({
  items,
  className,
}: {
  items: HBarItem[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-40 shrink-0 truncate text-[13px] text-fg">
            {it.label}
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(0, Math.min(100, it.pct))}%` }}
            />
          </div>
          <div className="w-16 shrink-0 text-right text-[13px] tnum text-fg-muted">
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
