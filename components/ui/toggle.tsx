"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
}

/** Monochrome switch. On = inked track; off = hairline track. 6px-family radius. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  id,
  className,
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        "disabled:opacity-40 disabled:pointer-events-none",
        checked ? "bg-accent" : "bg-transparent border border-hairline-strong",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full transition-transform",
          checked
            ? "translate-x-[18px] bg-accent-fg"
            : "translate-x-[3px] bg-fg-muted",
        )}
      />
    </button>
  );
}
