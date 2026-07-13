"use client";

import { useEffect, useState } from "react";

/**
 * Gate that only lets the timed exam run on a laptop/desktop. Blocks small
 * screens and — even when a phone requests the "desktop site" (which fakes a
 * wide viewport) — touch-only devices with no fine pointer (mouse/trackpad).
 */
export function ExamDeviceGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    function check() {
      const wideEnough = window.innerWidth >= 1024;
      const finePointer = window.matchMedia("(pointer: fine)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      // A phone/tablet (even in "desktop site" mode) reports a coarse pointer
      // and no fine pointer; a real laptop has a mouse/trackpad (fine pointer).
      const touchOnly = coarsePointer && !finePointer;
      setOk(wideEnough && !touchOnly);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (ok === null) return null; // avoid a flash before the check runs
  if (ok) return <>{children}</>;

  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[16px] bg-accent-weak text-accent">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="4.5" width="18" height="12" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M1.5 20h21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
          Please join from a laptop
        </h1>
        <p className="mx-auto mt-2.5 max-w-[32ch] text-[14.5px] leading-relaxed text-fg-muted">
          The timed exam needs a laptop or desktop with a keyboard and mouse.
          Open this page on a computer to begin — phones and tablets aren&apos;t
          supported.
        </p>
      </div>
    </div>
  );
}
