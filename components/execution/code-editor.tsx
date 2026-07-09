"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Minimal monospace code editor: a textarea with soft-tab handling. */
export function CodeEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
  minRows = 10,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  minRows?: number;
}) {
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.slice(0, start) + "    " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
    }
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      rows={minRows}
      className={cn(
        "w-full rounded-md border border-hairline bg-surface px-3 py-2.5",
        "font-mono text-[13px] leading-relaxed text-fg",
        "placeholder:text-fg-faint resize-y",
        "focus:outline-none focus-visible:border-accent",
        className,
      )}
    />
  );
}
