import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Placeholder block shown while a route's data is in flight.
 *
 * Exists so navigation is never a dead click: Next streams the matching
 * loading.tsx immediately, and the real content swaps in underneath. Same
 * hairline-and-no-shadow language as Card.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-hairline/70", className)}
      {...props}
    />
  );
}

/** A stack of table-ish rows — the shape most list routes settle into. */
export function SkeletonRows({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-hairline rounded-md border border-hairline">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-full" />
          <Skeleton
            className="h-3.5 flex-1"
            style={{ maxWidth: `${52 + ((i * 13) % 30)}%` }}
          />
          <Skeleton className="hidden h-3.5 w-16 shrink-0 sm:block" />
          <Skeleton className="hidden h-3.5 w-12 shrink-0 md:block" />
        </div>
      ))}
    </div>
  );
}
