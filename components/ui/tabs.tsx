"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

/** Underline tabs. Controlled. Motion is limited to the colour change. */
export function Tabs({
  items,
  value,
  onValueChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex items-center gap-6 border-b border-hairline", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative -mb-px h-9 text-[14px] transition-colors",
              active
                ? "text-fg font-medium border-b-2 border-fg"
                : "text-fg-muted hover:text-fg border-b-2 border-transparent",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Class for a segmented filter item rendered as a link (server-driven filters). */
export function segmentedItemClass(active: boolean): string {
  return cn(
    "inline-flex items-center h-7 rounded-md px-2.5 text-[13px] transition-colors",
    active
      ? "bg-accent text-accent-fg font-medium"
      : "text-fg-muted hover:text-fg hover:bg-surface",
  );
}

/** Hairline container that groups segmented filter items. */
export function SegmentedGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-hairline p-0.5",
        className,
      )}
      {...props}
    />
  );
}
