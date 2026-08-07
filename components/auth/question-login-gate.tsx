"use client";

import { useEffect, useRef, useState } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthMotion } from "@/components/auth/auth-motion";
import { IconLock } from "@/components/icons";

const OPEN_DELAY_MS = 2000;

/**
 * Delayed, blocking sign-in gate for a question opened from a shared link.
 * The question is allowed to render first, then this large modal takes focus.
 * AuthForm receives the exact question URL, so Google returns here afterwards.
 */
export function QuestionLoginGate({
  questionTitle,
  subjectName,
  returnTo,
}: {
  questionTitle: string;
  subjectName: string;
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function keepFocusInside(event: KeyboardEvent) {
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", keepFocusInside);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keepFocusInside);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="question-login-backdrop fixed inset-0 z-[120] grid place-items-center bg-black/40 backdrop-blur-[9px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-login-title"
        className="question-login-panel grid h-[85dvh] w-[85vw] min-w-0 max-w-[calc(100vw-24px)] overflow-x-hidden overflow-y-auto rounded-[14px] border-2 border-[#3d3d3d] bg-canvas shadow-[0_28px_90px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:overflow-hidden"
      >
        <div className="hidden min-h-0 p-3 lg:flex">
          <AuthMotion />
        </div>

        <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto bg-canvas">
          <header className="flex min-w-0 items-center justify-between gap-3 border-b border-hairline px-4 py-4 sm:px-9">
            <span className="shrink-0 text-[14px] font-semibold tracking-[-0.01em] text-fg">
              OPPE Practice
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-accent-border bg-accent-weak px-2 py-1 text-[10px] font-medium text-accent sm:px-2.5 sm:text-[11px]">
              <IconLock size={13} /> IITM
              <span className="hidden sm:inline">students</span>
            </span>
          </header>

          <main className="mx-auto flex w-full min-w-0 max-w-[460px] flex-1 flex-col justify-center px-4 py-7 text-center sm:px-10 sm:py-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">
              {subjectName}
            </p>
            <h2
              id="question-login-title"
              className="mt-3 text-[28px] font-semibold leading-[1.04] tracking-[-0.025em] text-fg sm:text-[40px]"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Sign in to continue
            </h2>
            <p className="mx-auto mt-3 max-w-[38ch] text-[14px] leading-relaxed text-fg-muted">
              You opened <span className="font-medium text-fg">{questionTitle}</span>.
              Sign in and we will bring you straight back to this exact question.
            </p>

            <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-faint">
              <span className="h-px flex-1 bg-hairline" />
              Your place is saved
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <AuthForm next={returnTo} />
          </main>
        </div>
      </div>
    </div>
  );
}
