import * as React from "react";
import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  sublabel?: string;
}

/** Vertical bars. Inked for activity, a hairline nub for empty days. */
export function BarColumnChart({
  data,
  height = 120,
  className,
}: {
  data: BarDatum[];
  height?: number;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 items-end justify-center"
              style={{ height: "100%" }}
              title={`${d.sublabel ?? d.label}: ${d.value}`}
            >
              <div
                className={cn(
                  "w-full max-w-[22px] rounded-[2px]",
                  d.value > 0 ? "bg-accent" : "bg-hairline-strong",
                )}
                style={{
                  height: d.value > 0 ? `${Math.max(pct, 3)}%` : "2px",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[11px] text-fg-muted tnum"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
