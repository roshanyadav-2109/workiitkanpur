"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconCheck, IconClose } from "@/components/icons";
import type { RuntimeProps } from "@/components/execution/types";

/** Render `inline code` segments (backtick-delimited) within an option label. */
function renderLabel(label: string): React.ReactNode {
  return label.split("`").map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="rounded border border-hairline bg-surface px-1 font-mono text-[0.9em]"
      >
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function McqRuntime({
  question,
  mode,
  onAnswerChange,
  onGraded,
  initialAnswer,
}: RuntimeProps) {
  const [selected, setSelected] = useState<string>(initialAnswer ?? "");
  const [checked, setChecked] = useState(false);

  const answer = question.mcq_answer; // null in exam mode (not sent to client)

  function pick(key: string) {
    if (checked) return;
    setSelected(key);
    onAnswerChange?.(key);
  }

  function onCheck() {
    if (!selected) return;
    setChecked(true);
    const correct = selected === answer;
    onGraded?.({ correct, passed: correct ? 1 : 0, total: 1 });
  }

  return (
    <div className="space-y-3">
      <ul role="radiogroup" aria-label="Answer options" className="space-y-2">
        {question.mcq_options.map((o) => {
          const isSelected = selected === o.key;
          const isCorrect = checked && answer === o.key;
          const isWrongPick = checked && isSelected && answer !== o.key;
          return (
            <li key={o.key}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Option ${o.key}${isCorrect ? ", correct answer" : isWrongPick ? ", your answer, incorrect" : ""}`}
                onClick={() => pick(o.key)}
                disabled={checked}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-[14px] transition-colors",
                  isCorrect
                    ? "border-accent bg-accent-weak"
                    : isWrongPick
                      ? "border-hairline-strong bg-surface"
                      : isSelected
                        ? "border-accent"
                        : "border-hairline hover:bg-surface",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[12px] font-medium tnum",
                    isSelected || isCorrect
                      ? "border-accent text-accent"
                      : "border-hairline-strong text-fg-muted",
                  )}
                >
                  {o.key}
                </span>
                <span className="flex-1">{renderLabel(o.label)}</span>
                {isCorrect && <IconCheck size={16} className="text-accent" />}
                {isWrongPick && (
                  <IconClose size={16} className="text-fg-muted" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {mode === "practice" && (
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={onCheck}
            disabled={!selected || checked}
          >
            Check answer
          </Button>
          {checked && (
            <span
              className={cn(
                "text-[13px]",
                selected === answer ? "text-accent" : "text-fg-muted",
              )}
            >
              {selected === answer ? "Correct" : "Not quite"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
