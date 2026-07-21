"use client";

import * as React from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

const INDENT = "    "; // 4 spaces

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Deliberately quiet: four muted colours, everything else stays ink. Enough to
 * tell structure from content at a glance without the editor turning into a
 * rainbow. */
const COMMENT = "#8b8b96"; // grey — comments recede
const KEYWORD = "#2f8f5b"; // green — def, return, if, for …
const BUILTIN = "#5a48d6"; // violet (the app accent) — print, len, range …
const STRING = "#9a6636"; // muted amber — literals

const KEYWORDS = new Set([
  "and", "as", "assert", "async", "await", "break", "class", "continue", "def",
  "del", "elif", "else", "except", "finally", "for", "from", "global", "if",
  "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise",
  "return", "try", "while", "with", "yield", "True", "False", "None",
]);

const BUILTINS = new Set([
  "abs", "all", "any", "bool", "chr", "dict", "divmod", "enumerate", "filter",
  "float", "format", "frozenset", "input", "int", "isinstance", "len", "list",
  "map", "max", "min", "ord", "print", "range", "reversed", "round", "set",
  "sorted", "str", "sum", "tuple", "type", "zip",
]);

/* Strings (triple-quoted first, so docstrings win), then comments, then words.
 * A half-typed string matches none of the string alternatives and falls through
 * to the single-character branch, so typing never garbles the line. */
const PY_TOKEN =
  /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|#[^\n]*|[A-Za-z_]\w*|[\s\S]/g;

function paint(text: string, color: string | null): string {
  const safe = escapeHtml(text);
  return color ? `<span style="color:${color}">${safe}</span>` : safe;
}

function highlightPython(code: string): string {
  let out = "";
  let m: RegExpExecArray | null;
  PY_TOKEN.lastIndex = 0;
  while ((m = PY_TOKEN.exec(code))) {
    const t = m[0];
    const head = t[0];
    let color: string | null = null;
    if (head === "#") color = COMMENT;
    else if (head === '"' || head === "'") color = STRING;
    else if (/[A-Za-z_]/.test(head)) {
      if (KEYWORDS.has(t)) color = KEYWORD;
      else if (BUILTINS.has(t)) color = BUILTIN;
    }
    out += paint(t, color);
  }
  return out;
}

/** SQL gets the same restraint: keywords green, strings amber, -- comments grey. */
const SQL_KEYWORDS = new Set(
  ("select from where group by order having join left right inner outer on as " +
    "and or not in is null distinct limit offset insert into values update set " +
    "delete create table primary key foreign references count sum avg min max " +
    "case when then else end union all asc desc between like exists")
    .split(" "),
);

const SQL_TOKEN =
  /--[^\n]*|'(?:''|[^'\n])*'|"(?:[^"\n])*"|[A-Za-z_]\w*|[\s\S]/g;

function highlightSql(code: string): string {
  let out = "";
  let m: RegExpExecArray | null;
  SQL_TOKEN.lastIndex = 0;
  while ((m = SQL_TOKEN.exec(code))) {
    const t = m[0];
    const head = t[0];
    let color: string | null = null;
    if (t.startsWith("--")) color = COMMENT;
    else if (head === "'" || head === '"') color = STRING;
    else if (/[A-Za-z_]/.test(head) && SQL_KEYWORDS.has(t.toLowerCase()))
      color = KEYWORD;
    out += paint(t, color);
  }
  return out;
}

function highlight(code: string, language: "python" | "sql"): string {
  const body = language === "sql" ? highlightSql(code) : highlightPython(code);
  // Trailing newline keeps the last line's height in sync with the textarea.
  return body + "\n";
}

const boxClass =
  "px-3 py-2.5 font-mono leading-relaxed [tab-size:4]";

/**
 * Monospace code editor built on a textarea, with real editor behaviour:
 *  - Enter carries the current line's indentation, and adds one level after a
 *    line ending in `:` `(` `[` `{` (so Python blocks indent automatically).
 *  - Tab / Shift+Tab indent / dedent the cursor line or the whole selection.
 *  - Backspace inside leading whitespace deletes a full indent level.
 * A highlighted layer sits behind a transparent textarea for syntax colour.
 */
export function CodeEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
  minRows = 10,
  fill = false,
  language = "python",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  minRows?: number;
  /** Grow to fill the parent (parent must have a bounded height). */
  fill?: boolean;
  /** Which highlighter to use. */
  language?: "python" | "sql";
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  // Selection to apply after a programmatic value change (controlled textarea).
  const pendingSelection = useRef<[number, number] | null>(null);

  const html = useMemo(() => highlight(value, language), [value, language]);

  useLayoutEffect(() => {
    if (pendingSelection.current && ref.current) {
      const [s, e] = pendingSelection.current;
      ref.current.selectionStart = s;
      ref.current.selectionEnd = e;
      pendingSelection.current = null;
    }
  });

  function syncScroll() {
    if (ref.current && preRef.current) {
      preRef.current.scrollTop = ref.current.scrollTop;
      preRef.current.scrollLeft = ref.current.scrollLeft;
    }
  }

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
          const outLines = lines.map((l) => l.replace(/^( {1,4}|\t)/, ""));
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
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-hairline bg-surface",
        "focus-within:border-accent",
        fill ? "h-full" : "",
        className,
      )}
      style={{ fontSize: "var(--code-font, 13px)" }}
    >
      <pre
        ref={preRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre text-fg",
          boxClass,
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        placeholder={placeholder}
        aria-label={ariaLabel}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={fill ? undefined : minRows}
        wrap="off"
        className={cn(
          "relative block w-full bg-transparent text-transparent caret-[#0a0a0a]",
          "placeholder:text-fg-faint focus:outline-none",
          boxClass,
          fill ? "h-full resize-none" : "resize-y",
        )}
      />
    </div>
  );
}
