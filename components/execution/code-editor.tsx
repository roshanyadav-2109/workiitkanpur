"use client";

import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const INDENT = "    "; // 4 spaces

/**
 * Monospace code editor built on a textarea, with real editor behaviour:
 *  - Enter carries the current line's indentation, and adds one level after a
 *    line ending in `:` `(` `[` `{` (so Python blocks indent automatically).
 *  - Tab / Shift+Tab indent / dedent the cursor line or the whole selection.
 *  - Backspace inside leading whitespace deletes a full indent level.
 */
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
  const ref = useRef<HTMLTextAreaElement>(null);
  // Selection to apply after a programmatic value change (controlled textarea).
  const pendingSelection = useRef<[number, number] | null>(null);

  useLayoutEffect(() => {
    if (pendingSelection.current && ref.current) {
      const [s, e] = pendingSelection.current;
      ref.current.selectionStart = s;
      ref.current.selectionEnd = e;
      pendingSelection.current = null;
    }
  });

  function apply(next: string, selStart: number, selEnd = selStart) {
    pendingSelection.current = [selStart, selEnd];
    onChange(next);
  }

  const lineStartOf = (text: string, pos: number) =>
    text.lastIndexOf("\n", pos - 1) + 1;

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // Enter — auto-indent
    if (e.key === "Enter") {
      e.preventDefault();
      const ls = lineStartOf(value, start);
      const lineToCursor = value.slice(ls, start);
      const indent = (lineToCursor.match(/^[ \t]*/) || [""])[0];
      const trimmedRight = lineToCursor.replace(/[ \t]+$/, "");
      const extra = /[:([{]$/.test(trimmedRight) ? INDENT : "";
      const insert = "\n" + indent + extra;
      const next = value.slice(0, start) + insert + value.slice(end);
      apply(next, start + insert.length);
      return;
    }

    // Tab / Shift+Tab — indent / dedent (line or selection)
    if (e.key === "Tab") {
      e.preventDefault();
      const blockStart = lineStartOf(value, start);
      const multiline = start !== end && value.slice(start, end).includes("\n");

      if (multiline || start !== end) {
        const block = value.slice(blockStart, end);
        const lines = block.split("\n");
        if (e.shiftKey) {
          const outLines = lines.map((l) =>
            l.replace(/^( {1,4}|\t)/, ""),
          );
          const removedFirst = lines[0].length - outLines[0].length;
          const out = outLines.join("\n");
          const next = value.slice(0, blockStart) + out + value.slice(end);
          apply(
            next,
            Math.max(blockStart, start - removedFirst),
            blockStart + out.length,
          );
        } else {
          const out = lines.map((l) => INDENT + l).join("\n");
          const next = value.slice(0, blockStart) + out + value.slice(end);
          apply(next, start + INDENT.length, blockStart + out.length);
        }
        return;
      }

      if (e.shiftKey) {
        const lead = (value.slice(blockStart).match(/^( {1,4}|\t)/) || [""])[0];
        if (lead) {
          const next =
            value.slice(0, blockStart) + value.slice(blockStart + lead.length);
          apply(next, Math.max(blockStart, start - lead.length));
        }
      } else {
        const next = value.slice(0, start) + INDENT + value.slice(end);
        apply(next, start + INDENT.length);
      }
      return;
    }

    // Backspace — delete a whole indent level when inside leading whitespace
    if (e.key === "Backspace" && start === end) {
      const ls = lineStartOf(value, start);
      const before = value.slice(ls, start);
      if (before.length > 0 && /^ +$/.test(before)) {
        const removeLen = ((before.length - 1) % INDENT.length) + 1;
        const next = value.slice(0, start - removeLen) + value.slice(end);
        apply(next, start - removeLen);
        e.preventDefault();
      }
    }
  }

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      rows={minRows}
      wrap="off"
      style={{ fontSize: "var(--code-font, 13px)" }}
      className={cn(
        "w-full rounded-md border border-hairline bg-surface px-3 py-2.5",
        "font-mono leading-relaxed text-fg",
        "placeholder:text-fg-faint resize-y",
        "focus:outline-none focus-visible:border-accent",
        className,
      )}
    />
  );
}
