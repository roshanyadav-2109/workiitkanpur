import * as React from "react";
import { cn } from "@/lib/utils";
import { dayKey } from "@/lib/utils";

/**
 * Contribution-style calendar. Colour is not available, so intensity is
 * carried by the opacity of the ink — a monochrome heatmap.
 */
export function StreakCalendar({
  counts,
  weeks = 14,
  today = new Date(),
  className,
}: {
  counts: Record<string, number>;
  weeks?: number;
  today?: Date;
  className?: string;
}) {
  // Walk back to the Sunday on/before (today - (weeks-1) weeks).
  const end = new Date(today);
  const start = new Date(end);
  start.setDate(end.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  const columns: { key: string; count: number; future: boolean }[][] = [];
  const cursor = new Date(start);
  const todayKey = dayKey(today);

  while (cursor <= end || columns.length < weeks) {
    const col: { key: string; count: number; future: boolean }[] = [];
    for (let row = 0; row < 7; row++) {
      const key = dayKey(cursor);
      col.push({
        key,
        count: counts[key] ?? 0,
        future: key > todayKey,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(col);
    if (columns.length >= weeks && cursor > end) break;
  }

  const intensity = (count: number): { className: string; style?: React.CSSProperties } => {
    if (count <= 0)
      return { className: "border border-hairline bg-transparent" };
    const opacity = count >= 5 ? 1 : count >= 3 ? 0.7 : count >= 2 ? 0.5 : 0.32;
    return { className: "bg-accent", style: { opacity } };
  };

  return (
    <div className={cn("inline-flex gap-[3px]", className)}>
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]">
          {col.map((cell) => {
            if (cell.future) {
              return (
                <div
                  key={cell.key}
                  className="h-[11px] w-[11px] rounded-[2px]"
                />
              );
            }
            const { className: intClass, style } = intensity(cell.count);
            return (
              <div
                key={cell.key}
                title={`${cell.key}: ${cell.count} ${cell.count === 1 ? "attempt" : "attempts"}`}
                className={cn("h-[11px] w-[11px] rounded-[2px]", intClass)}
                style={style}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
