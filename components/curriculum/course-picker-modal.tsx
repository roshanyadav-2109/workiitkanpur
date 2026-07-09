"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  resolveStep,
  subjectHref,
  type PickerState,
  type SubjectLite,
} from "@/lib/curriculum";
import { SubjectLogo } from "@/components/subject-logo";
import { IconClose, IconChevron } from "@/components/icons";

const STEP_TITLE: Record<string, string> = {
  subject: "Choose a subject",
  degree: "Choose your degree",
  level: "Choose the level",
};

export function CoursePickerModal({
  open,
  initial,
  subjects,
  onClose,
}: {
  open: boolean;
  initial: PickerState;
  subjects: SubjectLite[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<PickerState>(initial);
  const initialKey = JSON.stringify(initial);

  // Reset the selection whenever the modal (re)opens for a new entry point.
  useEffect(() => {
    if (open) setState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const step = resolveStep(state, subjects);
  const doneHref =
    step.kind === "done"
      ? subjectHref(step.subject, step.degree, step.level)
      : null;

  // Once the selection is fully resolved, go to the questions page.
  useEffect(() => {
    if (open && doneHref) {
      router.push(doneHref);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doneHref]);

  const back = useCallback(() => {
    setState((s) => {
      if (s.level) return { ...s, level: undefined };
      if (s.degree && !initial.degree) return { ...s, degree: undefined };
      if (s.subject && !initial.subject) return { ...s, subject: undefined };
      return s;
    });
  }, [initial]);

  if (!open || doneHref) return null;

  const canBack = JSON.stringify(state) !== initialKey;

  return (
    <div role="dialog" aria-modal="true" aria-label={STEP_TITLE[step.kind]}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-[var(--overlay)] backdrop-blur-md"
      />
      <div className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-md border border-hairline bg-canvas shadow-[var(--shadow-overlay)] sm:inset-[15%]">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div className="flex items-center gap-3">
            {canBack && (
              <button
                onClick={back}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
              >
                <IconChevron size={16} className="rotate-180" />
                Back
              </button>
            )}
            <h2 className="text-[16px] font-medium">{STEP_TITLE[step.kind]}</h2>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {step.kind === "subject" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {step.options.map((s) => (
                <button
                  key={s.slug}
                  disabled={!s.is_active}
                  onClick={() =>
                    setState((st) => ({ ...st, subject: s.slug }))
                  }
                  className={cn(
                    "flex items-center gap-3.5 rounded-md border px-5 py-5 text-left text-[15px] font-medium transition-colors",
                    s.is_active
                      ? "border-hairline-strong hover:bg-surface"
                      : "border-hairline text-fg-muted opacity-60",
                  )}
                >
                  <SubjectLogo slug={s.slug} size={28} />
                  <span className="flex-1">{s.name}</span>
                  {!s.is_active && (
                    <span className="text-[11px] font-normal text-fg-faint">
                      soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step.kind === "degree" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {step.options.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setState((st) => ({ ...st, degree: d.id }))}
                  className="rounded-md border border-hairline-strong px-5 py-6 text-left text-[15px] font-medium transition-colors hover:bg-surface"
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}

          {step.kind === "level" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {step.options.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setState((st) => ({ ...st, level: lvl }))}
                  className="rounded-md border border-hairline-strong px-5 py-6 text-center text-[15px] font-medium transition-colors hover:bg-surface"
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
