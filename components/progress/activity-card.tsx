"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { StreakCalendar } from "@/components/charts/streak-calendar";

export function ActivityCard({
  counts,
  streakLabel,
}: {
  counts: Record<string, number>;
  streakLabel: string;
}) {
  const years = useMemo(() => {
    const ys = Array.from(
      new Set(Object.keys(counts).map((k) => k.slice(0, 4))),
    ).sort((a, b) => b.localeCompare(a));
    return ys.length ? ys : ["—"];
  }, [counts]);
  const [year, setYear] = useState(years[0]);

  const filtered = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(counts).filter(([k]) => k.startsWith(year)),
      ),
    [counts, year],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-fg-muted">{streakLabel}</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-label="Filter activity by year"
            className="rounded-[6px] border border-hairline-strong bg-canvas px-2 py-1 text-[12px] font-medium text-fg"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <StreakCalendar counts={filtered} weeks={16} />
        </div>
      </CardBody>
    </Card>
  );
}
